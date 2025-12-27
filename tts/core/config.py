import os
from dotenv import load_dotenv

load_dotenv()

YC_API_KEY = os.environ["YC_API_KEY"]
YC_API_SECRET = os.environ["YC_API_SECRET"]

YC_S3_API_KEY = os.environ["YC_S3_API_KEY"]
YC_S3_API_SECRET = os.environ["YC_S3_API_SECRET"]