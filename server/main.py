import json
from flask import Flask, jsonify
from markupsafe import escape
import requests
from bs4 import BeautifulSoup
from lxml import etree
from base64 import b64decode

app = Flask(__name__)

def getPrice(soup):
    elem = soup.select(".a-price-whole")
    if elem:
        return (elem[0].contents[0])
    return None

def scrape(url):
    userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36"
    headers = {'User-Agenet':userAgent}
    session = requests.Session()
    resp = session.get(url,headers=headers)
    soup = BeautifulSoup(resp.content, "html.parser")
    # dom = etree.HTML(str(soup))
    price = getPrice(soup)
    print(f'[+] price: {price}')
    return price

@app.route("/amazon/<url>")
def hello_world(url):
    print(f'url : {url}')
    url = b64decode(url).decode()
    price = scrape(url)
    print(f'{price=}')

    # print(dom.xpath('/html/body/div[2]/div[2]/div[5]/div[4]/div[1]/div[3]/div/div/div/div/form/div/div/div/div/div[2]/div[1]/div/span/span[1]'))
    return jsonify({'price':price})