
from database import engine
import models

print("Creating new tables...")
models.Base.metadata.create_all(bind=engine)
print("Tables created successfully.")
