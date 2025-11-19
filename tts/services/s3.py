import boto3
from core.config import YC_S3_API_KEY, YC_S3_API_SECRET

s3_client = boto3.client('s3', aws_access_key_id=YC_S3_API_KEY, aws_secret_access_key=YC_S3_API_SECRET, endpoint_url = "https://storage.yandexcloud.net")

def upload_audio(file_name: str, data: bytes):
    s3_client.put_object(Bucket='listen-s3', Key=f'audio/{file_name}.wav', Body=data)

def check_audio_exists(file_name: str) -> bool:
    try:
        s3_client.head_object(Bucket='listen-s3', Key=f'audio/{file_name}.wav')
        return True
    except s3_client.exceptions.NoSuchKey:
        return False
    except s3_client.exceptions.ClientError as e:
        if e.response['Error']['Code'] == '404':
            return False
        else:
            raise