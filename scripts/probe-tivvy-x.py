#!/usr/bin/env python3
"""Manual, read-only Tivvy X API connectivity test. No scheduled requests or posting."""
import json, os
from datetime import datetime,timezone
from pathlib import Path
from urllib.parse import quote, urlencode
from urllib.request import Request,urlopen
from urllib.error import HTTPError,URLError

HANDLE="tivertontownfc"
OUT=Path("data/tivvy-x-test.json")
TOKEN=os.environ.get("X_BEARER_TOKEN","").strip()
def call(path):
    req=Request("https://api.x.com"+path,headers={"Authorization":"Bearer "+TOKEN,"Accept":"application/json","User-Agent":"TivvyLiveTrial/0.1"})
    with urlopen(req,timeout=20) as r:return json.load(r)
def main():
    result={"checkedAt":datetime.now(timezone.utc).isoformat(),"account":"@"+HANDLE,
            "state":"error","readOnly":True,"posts":[]}
    try:
        if not TOKEN:raise RuntimeError("X_BEARER_TOKEN is missing from Actions secrets")
        user=call("/2/users/by/username/"+quote(HANDLE))
        obj=user.get("data") or {}
        uid=obj.get("id")
        if not uid:raise RuntimeError("User lookup returned no user ID")
        result["userId"]=uid
        result["displayName"]=obj.get("name","")
        qs=urlencode({"max_results":5,"tweet.fields":"created_at,author_id"})
        data=call("/2/users/"+quote(str(uid))+"/tweets?"+qs)
        for item in data.get("data",[]):
            ident=str(item.get("id") or "")
            if ident:
                result["posts"].append({"id":ident,"createdAt":item.get("created_at"),
                    "url":"https://x.com/"+HANDLE+"/status/"+ident})
        result["state"]="ok"
        result["count"]=len(result["posts"])
    except HTTPError as e:
        result["state"]="http-error"
        result["httpStatus"]=e.code
        result["message"]="X API rejected the request; check credit balance, app access and rate limits. No credentials logged."
    except (URLError,TimeoutError) as e:
        result["state"]="network-error"
        result["message"]=type(e).__name__
    except Exception as e:
        result["message"]=str(e)[:180]
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(result,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print("X connectivity test:",result["state"],"posts:",len(result["posts"]))
if __name__=="__main__":main()
