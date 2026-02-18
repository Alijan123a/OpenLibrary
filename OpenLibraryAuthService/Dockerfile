FROM python:3.12
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn
COPY . .
RUN mkdir -p /app/data
EXPOSE 8002
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py seed_initial && gunicorn -b 0.0.0.0:8002 auth_service.wsgi"]
