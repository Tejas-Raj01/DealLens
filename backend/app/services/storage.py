import os
import io
from typing import Tuple
from minio import Minio
from minio.error import S3Error

from app.core.config import settings


class StorageService:
    def __init__(self):
        self.endpoint = settings.MINIO_ENDPOINT
        self.access_key = settings.MINIO_ACCESS_KEY
        self.secret_key = settings.MINIO_SECRET_KEY
        self.bucket_name = settings.MINIO_BUCKET_NAME
        self.secure = settings.MINIO_SECURE

        # Fallback local storage directory if MinIO connection fails
        self.local_storage_dir = "/tmp/deallens_storage"
        os.makedirs(self.local_storage_dir, exist_ok=True)

        self._client = None

    @property
    def client(self) -> Minio:
        if self._client is None:
            try:
                self._client = Minio(
                    self.endpoint,
                    access_key=self.access_key,
                    secret_key=self.secret_key,
                    secure=self.secure
                )
                if not self._client.bucket_exists(self.bucket_name):
                    self._client.make_bucket(self.bucket_name)
            except Exception as e:
                # Log warning and utilize local filesystem storage as graceful fallback
                print(f"[StorageService] Warning: MinIO connection failed ({e}). Using local fallback: {self.local_storage_dir}")
                self._client = None
        return self._client

    def upload_file(self, file_name: str, file_data: bytes, content_type: str = "application/pdf") -> str:
        """Upload file bytes to MinIO object storage or local filesystem fallback."""
        file_path = f"documents/{file_name}"
        
        try:
            client = self.client
            if client:
                data_stream = io.BytesIO(file_data)
                client.put_object(
                    bucket_name=self.bucket_name,
                    object_name=file_path,
                    data=data_stream,
                    length=len(file_data),
                    content_type=content_type
                )
                return file_path
        except Exception as e:
            print(f"[StorageService] Object storage upload exception: {e}. Falling back to local storage.")

        # Local storage fallback
        local_path = os.path.join(self.local_storage_dir, file_name)
        with open(local_path, "wb") as f:
            f.write(file_data)
        return local_path

    def get_file(self, file_path: str) -> bytes:
        """Retrieve file content bytes from MinIO or local filesystem."""
        try:
            client = self.client
            if client and file_path.startswith("documents/"):
                response = client.get_object(self.bucket_name, file_path)
                try:
                    return response.read()
                finally:
                    response.close()
                    response.release_conn()
        except Exception:
            pass

        # Check local path fallback
        if os.path.exists(file_path):
            with open(file_path, "rb") as f:
                return f.read()

        raise FileNotFoundError(f"File not found in storage: {file_path}")

    def delete_file(self, file_path: str) -> bool:
        """Remove file from storage."""
        try:
            client = self.client
            if client and file_path.startswith("documents/"):
                client.remove_object(self.bucket_name, file_path)
                return True
        except Exception:
            pass

        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False


storage_service = StorageService()
