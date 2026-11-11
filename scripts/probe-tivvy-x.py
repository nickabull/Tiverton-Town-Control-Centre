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
        qs=urlencode({"max_results":5,"tweet.fields":"created_at,author_id,attachments,entities,referenced_tweets","expansions":"attachments.media_keys","media.fields":"type,url,preview_image_url,alt_text"})
        data=call("/2/users/"+quote(str(uid))+"/tweets?"+qs)
        media={str(m.get("media_key")):m for m in (data.get("includes") or {}).get("media",[]) if m.get("media_key")}
        for item in data.get("data",[]):
            ident=str(item.get("id") or "")
            if ident:
                keys=(item.get("attachments") or {}).get("media_keys") or []
                pictures=[]
                for key in keys:
                    record=media.get(str(key),{})
                    pictures.append({"type":record.get("type","unknown"),
                        "url":record.get("url") or record.get("preview_image_url"),
                        "alt":record.get("alt_text") or ""})
                result["posts"].append({"id":ident,"createdAt":item.get("created_at"),
                    "text":item.get("text",""),"media":pictures,
                    "url":"https://x.com/"+HANDLE+"/status/"+ident})
        result["state"]="ok"
        result["count"]=len(result["posts"])
        result["contentRetrieved"]=True
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
