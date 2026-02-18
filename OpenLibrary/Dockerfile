FROM python:3.12
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN mkdir -p /app/data /app/media
EXPOSE 8000
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && (python manage.py seed_test_data || true) && gunicorn -w 1 -t 120 --keep-alive 5 --graceful-timeout 30 -b 0.0.0.0:8000 library_management.wsgi"]

