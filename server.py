from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware to allow requests from your React Native app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


class UserRequest(BaseModel):
    name: str

@app.get("/")
def list_tools():
    return {
        "books": {
            "got": ["s1", "s2", "s3"],
            "vikings": ["s1", "s2", "s3"]
        }
    }

@app.get("/execute")
def execute():
    return {"message": "Hyy myy name is Abhiraj Singh"}

@app.post("/greet")
def greet_user(user: UserRequest):
    if not user.name:
        raise HTTPException(status_code=400, detail="Name cannot be empty")
    return {"message": f"Hello, {user.name}!"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
