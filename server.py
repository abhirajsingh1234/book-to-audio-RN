from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from PDF_Reader_edge_tts_refined_multiple_voices import convert_text_to_audio

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
    bookname: str
    lesson : str

@app.get("/")
def list_tools():
    return {
        "books": {
            "MindSet Secrets for Winning": ["A MESSAGE FROM THE AUTHOR","WITH WINNING IN MIND","THE MEANING OF SUCCESS","IT’S NOT HOW YOU START, BUT WHERE YOU FINISH","A JOURNEY, NOT A DESTINATION","THE TREASURE CHEST","THE POWER OF THE PRINTED WORD","MY FIRST SET OF WINGS","SHARING THE MUSIC","P   ART 1:Mastering Your Mindset","1 The Believing Brain","2 The Seven Noble Truths of a Winner","3 Building the Self-Image of a Champion","4 Expectancy—The Key to Commitment and Persistence","5 The Moment of Decision","6 Prioritizing Your Passion and Goal Getting","PART 2:Mastering Perfect Practice","7 How to Structure Your Practice Sessions","8 Visualization and Rehearsal","9 Preparing for Your Big Day","10 Performance Time","11 Living with Intention"]
        }
    }
@app.post("/execute")
def execute(user: UserRequest):
    if not user.bookname:
        raise HTTPException(status_code=400, detail="Book name cannot be empty")
    elif not user.lesson:
        raise HTTPException(status_code=400, detail="Lesson cannot be empty")

    result = convert_text_to_audio(user.bookname,user.lesson)
     # Return the file as a FileResponse.
    return FileResponse(
        path=result,
        media_type="audio/mpeg",
        filename=result
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
