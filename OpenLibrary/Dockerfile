FROM python:3.12
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN mkdir -p /app/data /app/media
EXPOSE 8000
CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn -b 0.0.0.0:8000 library_management.wsgi"]

