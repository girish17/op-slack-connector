from flask import Flask
from dotenv import load_dotenv

app = Flask(__name__)
load_dotenv()


@app.route('/', methods=['GET'])
def hello_world():
    return "Hello there! Good to see you here :) We don't know what to show here yet!"
