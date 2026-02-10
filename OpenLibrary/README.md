# OpenLibrary (Main Backend)

Open Library Management System — Django REST API for books, shelves, and borrows.

- Permissions are added to groups; groups are assigned to users (users live in Auth Service).
- **QR codes:** This backend only stores `qr_code_id` on books. QR image generation and decoding are done by **OpenLibraryQRService** (separate microservice); frontend and any client should call the QR service for QR-related operations.

