"""Utility for asynchronous file streaming in ASGI environments."""

from asgiref.sync import sync_to_async


async def async_file_iterator(file_handle, chunk_size=8192):
    """Asynchronously iterate over a file-like object in chunks.

    This is required for ASGI (e.g., Daphne/Uvicorn) to avoid
    'StreamingHttpResponse must consume synchronous iterators' warnings.
    """
    try:
        while True:
            # Read a chunk in a thread-safe way
            data = await sync_to_async(file_handle.read)(chunk_size)
            if not data:
                break
            yield data
    finally:
        # Ensure the file handle is closed
        await sync_to_async(file_handle.close)()
