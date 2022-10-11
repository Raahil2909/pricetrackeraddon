import json
from flask import Flask, jsonify, request
from markupsafe import escape
import requests
from bs4 import BeautifulSoup
from lxml import etree
from base64 import b64decode
from time import sleep
from requests.adapters import HTTPAdapter, Retry


app = Flask(__name__)

def getPrice(soup):
    elem = soup.select(".a-price-whole")
    if elem:
        return (elem[0].contents[0])
    return None

def getProductName(soup):
    elem = soup.select("#productTitle")
    if elem:
        return (elem[0].text)
    return None

def fetchUrl(url):
    userAgent = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36"
    headers = {'User-Agenet':userAgent}
    session = requests.Session()

    retries = Retry(total=5, backoff_factor=0.1, status_forcelist=[ 500, 502, 503, 504 ])
    session.mount('http://', HTTPAdapter(max_retries=retries))

    resp = session.get(url,headers=headers,verify=False)
    return resp

def scrape(url):

    resp = fetchUrl(url)
      
    soup = BeautifulSoup(resp.content, "html.parser")
    price = getPrice(soup)
    productName = getProductName(soup)
    price = float(price.replace(',',''))
    print(f'[+] price: {price}')
    return price,productName


@app.route("/amazon", methods = ['POST'])
def fetchAmazon():
    print(f'[+] data: {request.form}')
    url = request.form['url']
    print(f'[+] url : {url}')
    price,productName = scrape(url)
    print(f'{price=}')
    return jsonify({'price':price,'productName':productName})