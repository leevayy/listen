from speechkit import model_repository, configure_credentials, creds
from core.config import YC_API_SECRET

configure_credentials(
    yandex_credentials=creds.YandexCredentials(
        api_key=YC_API_SECRET
    )
)

def synthesize(text):
   model = model_repository.synthesis_model()

   # Задайте настройки синтеза.
   model.voice = 'ermil'
   model.role = 'neutral'
   model.pitchShift = 0
   model.speed = 1.0

   result = model.synthesize(text, raw_format=True)
   
   return result
