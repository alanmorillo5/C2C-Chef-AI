from flask import Flask, render_template, request, jsonify, session
from flask_session import Session
import openai
import os

app = Flask(__name__)

# Session configuration
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

openai.api_key = 'sk-UZuZXInrUdjYoDt6XM3ldk9DJwmhLFcjri_L1EglyTT3BlbkFJW_Zae71GQ4YGFG-G1VaMI227palJ_JR5xhjzZl51gA'
app.secret_key = 'supersecretkey'


# Home route
@app.route('/')
def home():
    return render_template('index.html')


# Chat route - handles the conversation with the LLM
@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json['message']
    Ingredients = request.json['Ingredients']

    if 'conversation' not in session:
        session['conversation'] = []

    # Append the user's message to the conversation
    session['conversation'].append({"role": "user", "content": user_message})

    # Read the initial prompt from the file
    text_file_path = 'topic_prompts/chef_directive.txt'
    if not os.path.exists(text_file_path):
        return jsonify({'response': 'Initial prompt file not found.'})

    with open(text_file_path, 'r') as file:
        initial_prompt = file.read()

    # Construct the system message
    system_message = f"The user has scanned the following ingredients: {', '.join(Ingredients)}. Suggest recipes that primarily use these ingredients."

    # The messages structure for the API call
    messages = [{
        "role": "system",
        "content": initial_prompt
    }, {
        "role": "system",
        "content": system_message
    }] + session['conversation']

    try:
        # Make API call to OpenAI using the messages
        response = openai.chat.completions.create(model="gpt-3.5-turbo-1106",
                                                  messages=messages)
        # Extract the content from the response
        gpt_response = response.choices[0].message.content

        # Append the GPT response to the conversation history
        session['conversation'].append({
            "role": "assistant",
            "content": gpt_response
        })

        # Return the GPT response
        return jsonify({'response': gpt_response})
    except Exception as e:
        # Log the error and return a message
        app.logger.error(f"An error occurred: {e}")
        return jsonify({'error': str(e)}), 500


# Clear session route
@app.route('/clear_session', methods=['GET'])
def clear_session():
    # Clear the session
    session.clear()
    return jsonify({'status': 'session cleared'})


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8080)
