"""File Upload Validators and Security Utilities

This module provides comprehensive file upload security including:
- File size validation
- MIME type validation
- Filename sanitization
- Content validation

Usage:
    from core.validators import validate_file_upload, FileUploadValidator

    # In serializer
    file = serializers.FileField(validators=[validate_file_upload])

    # For more control
    validator = FileUploadValidator(
        max_size_mb=5,
        allowed_extensions=['jpg', 'jpeg', 'png', 'pdf'],
        allowed_mime_types=['image/jpeg', 'image/png', 'application/pdf']
    )
    validator(uploaded_file)
"""

import hashlib
import mimetypes
import os
import re
import uuid

from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import UploadedFile


class FileUploadValidator:
    """Comprehensive file upload validator for security.

    Features:
    - File size limits (prevents disk exhaustion)
    - Extension whitelist validation
    - MIME type validation
    - Filename sanitization
    - Magic bytes verification (optional)
    """

    # Default maximum file size: 5MB
    DEFAULT_MAX_SIZE_BYTES = 5 * 1024 * 1024

    # Allowed extensions for different file types
    IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp"}
    DOCUMENT_EXTENSIONS = {"pdf", "doc", "docx", "txt"}
    ID_DOCUMENT_EXTENSIONS = {"jpg", "jpeg", "png", "pdf"}

    # MIME type mapping
    EXTENSION_MIME_MAP = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp",
        "pdf": "application/pdf",
        "doc": "application/msword",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "txt": "text/plain",
    }

    # Magic bytes (file signatures) for common file types
    MAGIC_BYTES = {
        "jpg": [b"\xff\xd8\xff"],
        "jpeg": [b"\xff\xd8\xff"],
        "png": [b"\x89PNG\r\n\x1a\n"],
        "gif": [b"GIF87a", b"GIF89a"],
        "pdf": [b"%PDF"],
        "webp": [b"RIFF"],
    }

    def __init__(
        self,
        max_size_mb: float = 5.0,
        allowed_extensions: list | None = None,
        allowed_mime_types: list | None = None,
        verify_magic_bytes: bool = True,
        sanitize_filename: bool = True,
    ):
        """Initialize the validator.

        Args:
            max_size_mb: Maximum file size in megabytes (default: 5MB)
            allowed_extensions: List of allowed file extensions (without dot)
            allowed_mime_types: List of allowed MIME types
            verify_magic_bytes: Whether to verify file content matches extension
            sanitize_filename: Whether to sanitize uploaded filename

        """
        self.max_size_bytes = int(max_size_mb * 1024 * 1024)
        self.allowed_extensions = set(allowed_extensions or self.ID_DOCUMENT_EXTENSIONS)
        self.allowed_mime_types = allowed_mime_types
        self.verify_magic_bytes = verify_magic_bytes
        self.sanitize_filename = sanitize_filename

    def __call__(self, file: UploadedFile) -> None:
        """Validate the uploaded file.

        Args:
            file: Django UploadedFile instance

        Raises:
            ValidationError: If validation fails

        """
        self.validate_size(file)
        self.validate_extension(file)
        self.validate_mime_type(file)

        if self.verify_magic_bytes:
            self.validate_magic_bytes(file)

        if self.sanitize_filename:
            # Modify filename in place
            file.name = self.get_sanitized_filename(file.name)

    def validate_size(self, file: UploadedFile) -> None:
        """Validate file size doesn't exceed maximum."""
        if file.size > self.max_size_bytes:
            max_mb = self.max_size_bytes / (1024 * 1024)
            raise ValidationError(
                f"File size exceeds maximum allowed size of {max_mb:.1f}MB. "
                f"Your file is {file.size / (1024 * 1024):.1f}MB.",
                code="file_too_large",
            )

    def validate_extension(self, file: UploadedFile) -> None:
        """Validate file extension is in allowed list."""
        ext = self._get_extension(file.name)

        if ext not in self.allowed_extensions:
            allowed = ", ".join(sorted(self.allowed_extensions))
            raise ValidationError(
                f"File extension '.{ext}' is not allowed. " f"Allowed extensions: {allowed}",
                code="invalid_extension",
            )

    def validate_mime_type(self, file: UploadedFile) -> None:
        """Validate MIME type matches expected type for extension."""
        ext = self._get_extension(file.name)
        expected_mime = self.EXTENSION_MIME_MAP.get(ext)

        if expected_mime:
            # Get MIME type from file content
            detected_mime = self._detect_mime_type(file)

            # Check against allowed MIME types if specified
            if self.allowed_mime_types:
                if detected_mime not in self.allowed_mime_types:
                    allowed = ", ".join(self.allowed_mime_types)
                    raise ValidationError(
                        f"File MIME type '{detected_mime}' is not allowed. " f"Allowed types: {allowed}",
                        code="invalid_mime_type",
                    )
            # Otherwise check extension matches detected MIME
            elif detected_mime and detected_mime != expected_mime:
                # Allow some flexibility for image subtypes
                if not self._mime_types_compatible(expected_mime, detected_mime):
                    raise ValidationError(
                        f"File content type '{detected_mime}' does not match " f"expected type for '.{ext}' extension.",
                        code="mime_mismatch",
                    )

    def validate_magic_bytes(self, file: UploadedFile) -> None:
        """Verify file starts with expected magic bytes."""
        ext = self._get_extension(file.name)
        expected_signatures = self.MAGIC_BYTES.get(ext)

        if expected_signatures:
            # Read first 16 bytes
            file.seek(0)
            header = file.read(16)
            file.seek(0)  # Reset for further processing

            # Check if any expected signature matches
            matches = any(header.startswith(sig) for sig in expected_signatures)

            if not matches:
                raise ValidationError(
                    f"File content does not match expected format for '.{ext}' files. "
                    "The file may be corrupted or incorrectly named.",
                    code="invalid_file_content",
                )

    @staticmethod
    def get_sanitized_filename(filename: str) -> str:
        """Sanitize filename to prevent path traversal and other attacks.

        Args:
            filename: Original filename

        Returns:
            Sanitized filename with UUID prefix for uniqueness

        """
        # Get just the filename without path
        basename = os.path.basename(filename)

        # Remove any non-alphanumeric characters except dots and underscores
        safe_name = re.sub(r"[^\w\.\-]", "_", basename)

        # Prevent double extensions that could bypass filters
        parts = safe_name.rsplit(".", 1)
        if len(parts) == 2:
            name, ext = parts
            # Remove any dots from the name part
            name = name.replace(".", "_")
            safe_name = f"{name}.{ext}"

        # Add UUID prefix for uniqueness and unpredictability
        unique_prefix = uuid.uuid4().hex[:8]

        return f"{unique_prefix}_{safe_name}"

    @staticmethod
    def get_file_hash(file: UploadedFile, algorithm: str = "sha256") -> str:
        """Calculate hash of file content.

        Useful for:
        - Detecting duplicate uploads
        - Verifying file integrity
        - Creating unique identifiers
        """
        hasher = hashlib.new(algorithm)
        file.seek(0)

        for chunk in file.chunks():
            hasher.update(chunk)

        file.seek(0)
        return hasher.hexdigest()

    @staticmethod
    def _get_extension(filename: str) -> str:
        """Get lowercase file extension without dot."""
        return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    @staticmethod
    def _detect_mime_type(file: UploadedFile) -> str | None:
        """Detect MIME type from file content or name."""
        # Try content_type from upload
        if hasattr(file, "content_type") and file.content_type:
            return file.content_type

        # Fallback to guessing from filename
        mime_type, _ = mimetypes.guess_type(file.name)
        return mime_type

    @staticmethod
    def _mime_types_compatible(expected: str, detected: str) -> bool:
        """Check if MIME types are compatible (e.g., image/jpeg vs image/jpg)."""
        # Same type
        if expected == detected:
            return True

        # Same category (e.g., both images)
        exp_category = expected.split("/")[0]
        det_category = detected.split("/")[0]

        return exp_category == det_category


# Pre-configured validators for common use cases
validate_id_document = FileUploadValidator(
    max_size_mb=5.0, allowed_extensions=["jpg", "jpeg", "png", "pdf"], verify_magic_bytes=True
)

validate_customer_photo = FileUploadValidator(
    max_size_mb=2.0, allowed_extensions=["jpg", "jpeg", "png"], verify_magic_bytes=True
)

validate_general_document = FileUploadValidator(
    max_size_mb=10.0, allowed_extensions=["pdf", "doc", "docx", "txt", "jpg", "jpeg", "png"], verify_magic_bytes=True
)


# Default validator for general file uploads
def validate_file_upload(file: UploadedFile) -> None:
    """Default file upload validator.

    Validates:
    - Max 5MB file size
    - Common safe extensions only
    - MIME type matches extension
    - Magic bytes verification
    """
    validator = FileUploadValidator()
    validator(file)
