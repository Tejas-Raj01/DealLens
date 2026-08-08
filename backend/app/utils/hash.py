import hashlib


def compute_sha256(file_bytes: bytes) -> str:
    """Compute SHA256 hash of raw file bytes for document deduplication."""
    sha256_hash = hashlib.sha256()
    sha256_hash.update(file_bytes)
    return sha256_hash.hexdigest()
