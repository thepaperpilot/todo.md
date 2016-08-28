 #!/usr/bin/env python
 # coding=utf-8

import json
import logging
import os.path
import tornado
import httplib2
import googleapiclient.http
import io
from apiclient.discovery import build
from oauth2client import client
from pprint import pprint, pformat
from tornado import gen, web, websocket

class BaseHandler(web.RequestHandler):
    def get_current_user(self):
        return self.get_secure_cookie("user")

class LinkSocketHandler(websocket.WebSocketHandler):
    links = []
    json = '['
    drive_service = None
    file = None

    thread_pool = tornado.concurrent.futures.ThreadPoolExecutor(4)

    def get_compression_options(self):
        # Non-None enables compression with default options.
        return {}

    def open(self):
        credentials = client.OAuth2Credentials.from_json(self.get_secure_cookie("user"))
        self.drive_service = build('drive', 'v3', http=credentials.authorize(httplib2.Http()))

        response = self.drive_service.files().list(spaces='appDataFolder',
                                     q="name='todo.md'").execute()

        if response.get('files', []):
            self.file = response.get('files', [])[0]
        else:
            file_metadata = {
                'name' : 'todo.md',
                'parents': [ 'appDataFolder']
            }
            media = googleapiclient.http.MediaFileUpload('README.md', mimetype='text/markdown')
            self.file = self.drive_service.files().create(body=file_metadata,
                                                media_body=media).execute()

        message = json.dumps({
            "message": "update",
            "content": self.drive_service.files().get_media(fileId=self.file.get('id')).execute()
        })
        self.write_message(message)

    def on_message(self, msg):
        message = json.loads(msg)
        if message["message"] == "save":
            fh = io.BytesIO(message["content"].encode('utf-8'))
            media = googleapiclient.http.MediaIoBaseUpload(fh, mimetype='text/markdown;charset=utf-8')
            self.drive_service.files().update(fileId=self.file.get('id'),media_body=media).execute()
        elif message["message"] == "log":
            print message["content"]

class MainHandler(BaseHandler):
    @web.authenticated
    def get(self):
        credentials = client.OAuth2Credentials.from_json(self.get_secure_cookie("user"))
        if credentials.access_token_expired:
            self.redirect("/auth")
            return
        self.render('index.html')

class AuthHandler(BaseHandler):
    def get(self):
        self.clear_cookie("user")
        self.clear_cookie("token")
        self.clear_cookie("refresh")
        code = self.get_arguments('code')
        if code:
            credentials = flow.step2_exchange(code[0])
            self.set_secure_cookie("user", credentials.to_json())
            self.redirect("/")
        else:
            error = self.get_arguments('error')
            if error:
                print error
            url = flow.step1_get_authorize_url()
            self.render('authenticate.html', link=url)

def get_client_object():
    f = client.flow_from_clientsecrets(
                    'client_secret.json',
                    scope='https://www.googleapis.com/auth/drive.appdata',
                    redirect_uri='http://127.0.0.1:65010/auth')

    return f

logging.basicConfig()

flow = get_client_object()

with file('cookie_secret.txt') as secret:
    application = web.Application(
        [
            (r"/", MainHandler),
            (r"/auth", AuthHandler),
            (r"/linksocket", LinkSocketHandler),
            ],
        cookie_secret=secret.read(),
        template_path=os.path.join(os.path.dirname(__file__), "templates"),
        static_path=os.path.join(os.path.dirname(__file__), "static"),
        login_url="/auth",
        )

application.listen(65010)
tornado.ioloop.IOLoop.current().start()

logging.shutdown()
