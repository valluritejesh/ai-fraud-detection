import abc
import hashlib
import logging
import tempfile
from contextlib import contextmanager
from pathlib import Path
from typing import Optional, Dict, Any, Tuple
from app.core.config import settings

logger = logging.getLogger("storage")

class EvidenceStorageService(abc.ABC):
    """Abstract interface for storing and retrieving claims evidence files."""

    @abc.abstractmethod
    async def save_evidence(
        self,
        file_bytes: bytes,
        filename: str,
        claim_id: str,
        content_type: str = "application/octet-stream",
        metadata: Optional[Dict[str, str]] = None
    ) -> Tuple[str, str, int]:
        """
        Saves evidence content.
        Returns (stored_identifier_or_path, sha256_hash, file_size_bytes)
        """
        pass

    @abc.abstractmethod
    async def read_evidence(self, identifier: str) -> bytes:
        """Reads file bytes from storage using identifier/path."""
        pass

    @abc.abstractmethod
    async def exists(self, identifier: str) -> bool:
        """Checks if file exists in storage."""
        pass

    @abc.abstractmethod
    async def delete_evidence(self, identifier: str) -> bool:
        """Deletes file if exists."""
        pass

    @abc.abstractmethod
    async def get_metadata(self, identifier: str) -> Dict[str, Any]:
        """Returns metadata such as content_type, size, sha256."""
        pass


class LocalEvidenceStorage(EvidenceStorageService):
    """Local filesystem implementation of EvidenceStorageService."""

    def __init__(self, base_dir: Optional[Path] = None):
        self.base_dir = base_dir or settings.UPLOAD_DIR
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _resolve_path(self, identifier: str) -> Path:
        p = Path(identifier)
        if p.exists():
            return p
        if p.is_absolute():
            return p
        candidate = self.base_dir / identifier
        if candidate.exists():
            return candidate
        if (Path.cwd() / identifier).exists():
            return Path.cwd() / identifier
        return candidate

    async def save_evidence(
        self,
        file_bytes: bytes,
        filename: str,
        claim_id: str,
        content_type: str = "application/octet-stream",
        metadata: Optional[Dict[str, str]] = None
    ) -> Tuple[str, str, int]:
        sha256 = hashlib.sha256(file_bytes).hexdigest()
        file_size = len(file_bytes)

        safe_filename = Path(filename).name
        claim_dir = self.base_dir / claim_id
        claim_dir.mkdir(parents=True, exist_ok=True)
        target_path = claim_dir / safe_filename

        target_path.write_bytes(file_bytes)
        logger.info(f"Saved local evidence: {target_path} ({file_size} bytes, sha256={sha256[:8]}...)")
        return str(target_path), sha256, file_size

    async def read_evidence(self, identifier: str) -> bytes:
        p = self._resolve_path(identifier)
        if not p.exists():
            raise FileNotFoundError(f"Evidence file not found: {identifier}")
        return p.read_bytes()

    async def exists(self, identifier: str) -> bool:
        return self._resolve_path(identifier).exists()

    async def delete_evidence(self, identifier: str) -> bool:
        p = self._resolve_path(identifier)
        if p.exists():
            p.unlink()
            return True
        return False

    async def get_metadata(self, identifier: str) -> Dict[str, Any]:
        p = self._resolve_path(identifier)
        if not p.exists():
            raise FileNotFoundError(f"Evidence file not found: {identifier}")
        stat = p.stat()
        file_bytes = p.read_bytes()
        sha256 = hashlib.sha256(file_bytes).hexdigest()
        return {
            "identifier": str(p),
            "filename": p.name,
            "size_bytes": stat.st_size,
            "sha256_hash": sha256,
            "storage_provider": "local"
        }


class AzureBlobEvidenceStorage(EvidenceStorageService):
    """
    Microsoft Azure Blob Storage implementation of EvidenceStorageService.
    Supports Connection String or Managed Identity (DefaultAzureCredential).
    """

    def __init__(self):
        self.container_name = settings.AZURE_STORAGE_CONTAINER or "evidence-files"
        self.connection_string = settings.AZURE_STORAGE_CONNECTION_STRING
        self.account_name = settings.AZURE_STORAGE_ACCOUNT
        self._blob_service_client = None

    def _get_client(self):
        if self._blob_service_client is not None:
            return self._blob_service_client

        try:
            from azure.storage.blob import BlobServiceClient
        except ImportError:
            raise RuntimeError("azure-storage-blob is required for AzureBlobEvidenceStorage.")

        if self.connection_string:
            self._blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)
            return self._blob_service_client
        elif self.account_name:
            from azure.identity import DefaultAzureCredential
            account_url = f"https://{self.account_name}.blob.core.windows.net"
            credential = DefaultAzureCredential()
            self._blob_service_client = BlobServiceClient(account_url, credential=credential)
            return self._blob_service_client
        else:
            raise ValueError(
                "Neither AZURE_STORAGE_CONNECTION_STRING nor AZURE_STORAGE_ACCOUNT is configured."
            )

    def _get_blob_client(self, blob_name: str):
        client = self._get_client()
        container_client = client.get_container_client(self.container_name)
        try:
            if not container_client.exists():
                container_client.create_container()
        except Exception as e:
            logger.warning(f"Container existence check error: {e}")
        return container_client.get_blob_client(blob_name)

    async def save_evidence(
        self,
        file_bytes: bytes,
        filename: str,
        claim_id: str,
        content_type: str = "application/octet-stream",
        metadata: Optional[Dict[str, str]] = None
    ) -> Tuple[str, str, int]:
        sha256 = hashlib.sha256(file_bytes).hexdigest()
        file_size = len(file_bytes)
        safe_filename = Path(filename).name
        blob_name = f"claims/{claim_id}/{safe_filename}"

        meta = dict(metadata or {})
        meta["sha256"] = sha256
        meta["claim_id"] = claim_id
        meta["filename"] = safe_filename

        from azure.storage.blob import ContentSettings
        blob_client = self._get_blob_client(blob_name)
        blob_client.upload_blob(
            file_bytes,
            overwrite=True,
            content_settings=ContentSettings(content_type=content_type),
            metadata=meta
        )

        logger.info(f"Uploaded evidence to Azure Blob: {blob_name} ({file_size} bytes, sha256={sha256[:8]}...)")
        # Also cache locally if local UPLOAD_DIR exists for downstream vision/doc parsers
        try:
            claim_dir = settings.UPLOAD_DIR / claim_id
            claim_dir.mkdir(parents=True, exist_ok=True)
            local_cache = claim_dir / safe_filename
            local_cache.write_bytes(file_bytes)
        except Exception:
            pass

        return blob_name, sha256, file_size

    async def read_evidence(self, identifier: str) -> bytes:
        blob_client = self._get_blob_client(identifier)
        stream = blob_client.download_blob()
        return stream.readall()

    async def exists(self, identifier: str) -> bool:
        try:
            blob_client = self._get_blob_client(identifier)
            return blob_client.exists()
        except Exception:
            return False

    async def delete_evidence(self, identifier: str) -> bool:
        try:
            blob_client = self._get_blob_client(identifier)
            if blob_client.exists():
                blob_client.delete_blob()
                return True
            return False
        except Exception as e:
            logger.error(f"Error deleting Azure Blob {identifier}: {e}")
            return False

    async def get_metadata(self, identifier: str) -> Dict[str, Any]:
        blob_client = self._get_blob_client(identifier)
        props = blob_client.get_blob_properties()
        return {
            "identifier": identifier,
            "filename": Path(identifier).name,
            "size_bytes": props.size,
            "content_type": props.content_settings.content_type if props.content_settings else "application/octet-stream",
            "sha256_hash": (props.metadata or {}).get("sha256", ""),
            "metadata": props.metadata,
            "storage_provider": "azure_blob"
        }


def get_storage_service() -> EvidenceStorageService:
    """Factory function returning the configured storage provider."""
    provider = (settings.STORAGE_PROVIDER or "local").lower().strip()
    if provider in ["azure", "azure_blob", "blob"]:
        try:
            return AzureBlobEvidenceStorage()
        except Exception as e:
            logger.warning(f"AzureBlobEvidenceStorage init failed ({e}); falling back to LocalEvidenceStorage.")
            return LocalEvidenceStorage()
    return LocalEvidenceStorage()


@contextmanager
def temporary_evidence_file(file_bytes: bytes, filename: str):
    """
    Context manager creating a temporary file on the local filesystem from evidence bytes.
    Guarantees deletion in finally block so legacy parsers requiring pathlib.Path
    can safely operate without leaking files.
    """
    suffix = Path(filename).suffix or ".tmp"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = Path(tmp.name)
    try:
        yield tmp_path
    finally:
        try:
            if tmp_path.exists():
                tmp_path.unlink()
        except Exception as e:
            logger.warning(f"Error removing temporary evidence file {tmp_path}: {e}")
