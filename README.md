# video-parser

[![version](https://img.shields.io/npm/v/video-parser.svg) ![download](https://img.shields.io/npm/dm/video-parser.svg)](https://www.npmjs.com/package/video-parser)

Extract video information by parsing the url.

Important
* If you find compatibility issues, check the bug reporting page.
* Change facebook video data stucture at v1.8.0 (see also [#15](/../../issues/15))

[![js-standard-style](https://cdn.rawgit.com/feross/standard/master/badge.svg)](https://github.com/feross/standard)

### Support provider

* [youtube](https://www.youtube.com/)
* [vimeo](https://vimeo.com/)
* [facebook video](https://developers.facebook.com/docs/graph-api/reference/video): The videos can be registered to the pages only. Other video registered individuals does not provide the metadata from api.
* [youku](http://www.youku.com/)
* [dailymotion](http://www.dailymotion.com/kr)
* [naver tvcast](http://tvcast.naver.com) - It can be stopped unexpectedly due to parse the data from the site.
* [rutube](http://rutube.ru/)
* [daum tvpot](http://tvpot.daum.net) - It can be stopped unexpectedly due to parse the data from the site.

## Dependencies

### ffmpeg

* get metadata of custom video.
* [http://www.ffmpeg.org/](http://www.ffmpeg.org/)

```
$ brew install ffmpeg --with-openssl
```

## Usage

```javascript
var VideoParser = require('video-parser')

var parser = new VideoParser({
    name: 'video-parser-cache',
    redis: {
        host: '127.0.0.1',
        port: 6379
    },
    youtube: {
        key: ''
    },
    vimeo: {
        access_token: ''
    },
    youku: {
        key: ''
    }
    ttl: 3600 * 12  // 1 day
})


parser.on('error', function(err) {
    console.error(err)
})

var url = [
    'https://www.youtube.com/watch?v=-RWl24TUW6g',
    'https://vimeo.com/60788712',
    'https://www.facebook.com/snackk100/videos/vb.713427005470569/765726663573936/?type=2&theater',
    'http://v.youku.com/v_show/id_XMTMwMDYxMjQxMg==_ev_1.html?from=y1.3-idx-uhome-1519-20887.205805-205902.1-1',
    'http://www.dailymotion.com/video/x2jvvep',
    'http://tvcast.naver.com/v/584455',
    'http://rutube.ru/video/2a39043b2108428a150fa27376adbea2/',
    'http://tvpot.daum.net/mypot/View.do?clipid=72583600&ownerid=mRlSExWR4-Q0'
]

for (var i = 0; i < url.length; i++) {
    parser.parse(function(err, video) {
        console.log(video)
    }, url[i])
}

```

## Format

```json
{
   "id":"-RWl24TUW6g",
   "url":"https://www.youtube.com/watch?v=-RWl24TUW6g",
   "name":"Earned It - The Weeknd - Kina Grannis & MAX & KHS Cover",
   "desc":"Grab this on iTunes here: https://itunes.apple.com/us/album/earned-it-single/id994064741\nCheck out our epic song with Coke Bottles!! https://www.youtube.com/watch?v=ZzuRvzsNpTU\nAnd... I'm coming to Singapore, Thailand, and Japan! Stay tuned for Meet and Greet info :)\n_______________\n\nGET IN TOUCH!\n\nKURT:\nFacebook: http://www.facebook.com/kurthugoschneider\nTwitter: http://www.twitter.com/kurthschneider\n\nMAX:\nFacebook: http://on.fb.me/wZYjB3\nTwitter: http://www.twitter.com/maxgschneider\nYouTube: http://www.youtube.com/user/MaxSchneider1\n\nKINA:\nFacebook: https://www.facebook.com/kinagrannis\nTwitter: https://twitter.com/kinagrannis\nYoutube: https://www.youtube.com/user/kinagrannis\n\n_______________\n\"Earned It (Fifty Shades of Grey)” – originally by The Weeknd\nWritten by: Abel Tesfaye, Stephan Moccio, Jason Quenneville & Ahmad Balshe\nPublished by: Universal Music Corp, WB Music Corp & Songs of SMP",
   "thumb_url":"https://i.ytimg.com/vi/-RWl24TUW6g/mqdefault.jpg",
   "duration":186,
   "ratings":{

   },
   "details":{
      "definition":"hd",
      "author":{
         "id":"UCplkk3J5wrEl0TNrthHjq4Q",
         "title":"Kurt Hugo Schneider"
      }
   },
   "provider":"youtube"
}

{
   "id":"60788712",
   "url":"https://vimeo.com/60788712",
   "name":"Mi niña mi vida",
   "desc":"A man moves amidst the noisy crowds at an amusement park, accompanied only by a large pink stuffed toy. Encircled by the sounds and incessant movements of the rides, this strange duo anchors long sequence shots that navigate the mechanical rhythms and decor of the park.\n\nUn homme seul et son gros ours en peluche rose forment un étrange duo parmi la foule d’un parc d’amusement. Isolés par les bruits et le mouvement incessant des manèges qui les entourent, ils sont le point d'ancrage de longs plans séquences rythmés par ce décor mécanique.",
   "thumb_url":"https://i.vimeocdn.com/video/462264450_295x166.jpg",
   "duration":1150,
   "ratings":[
      "safe"
   ],
   "details":{
      "definition":"",
      "author":{
         "id":"3896730",
         "title":"Yan Giroux"
      }
   },
   "provider":"vimeo"
}

{
    "id": "765726663573936",
    "url": "https://www.facebook.com/713427005470569/videos/765726663573936",
    "name": "스낵 - Snackk.tv",
    "desc": "애 엄마가 보면 기겁할 듯 ㅇ0ㅇ\n\n #첫눈 온 날 라이딩 영상보며 대리만족\n+귀여운 아기는 덤",
    "thumb_url": "https://scontent.xx.fbcdn.net/hvthumb-xap1/v/t15.0-10/s480x480/12105363_765755180237751_1022961937_n.jpg?oh=e7e102c2dce9fa6463b3ffc9cedff592&oe=56E72E65",
    "duration": 233,
    "ctime": "2015-11-26T14:58:17+09:00",
    "ratings": null,
    "details": {
        "definition": "",
        "author": {
            "id": "713427005470569",
            "title": "스낵 - Snackk.tv"
        },
        "source": "https://video.xx.fbcdn.net/hvideo-xpa1/v/t43.1792-2/12251290_1016430301743231_1083820292_n.mp4?efg=eyJybHIiOjI5OTQsInJsYSI6NDA5NiwidmVuY29kZV90YWciOiJzdmVfaGQifQ%3D%3D&rl=2994&vabr=1996&oh=31a605409c8bd8fd3f427793a7377b7b&oe=5659E9A0"
    },
    "provider": "facebook"
}

{
    "id": "XMTI5NTcwMDA3Mg==",
    "url": "http://v.youku.com/v_show/id_XMTI5NTcwMDA3Mg==.html",
    "name": "李湘隔空合唱邓丽君 花千骨东方彧卿深情献唱",
    "desc": "",
    "thumb_url": "http://g2.ykimg.com/1100641F4655B76A9B6A612E697BDCD5D108B3-6D55-8549-378A-C357FE00D212",
    "duration": "111.41",
    "ctime": "2015-07-28T19:15:32+09:00",
    "details": {
        "definition": "",
        "author": {
            "id": "778664924",
            "title": "歌手是谁"
        }
    },
    "provider": "youku"
}

{
    "id": "x2jvvep",
    "url": "http://www.dailymotion.com/video/x2jvvep_coup-incroyable-pendant-un-match-de-ping-pong_tv",
    "name": "Coup incroyable pendant un match de ping-pong",
    "desc": "",
    "thumb_url": "http://s2.dmcdn.net/JdVUk/x720-jcH.jpg",
    "duration": 12,
    "ctime": "2015-03-19T04:15:48+09:00",
    "ratings": {},
    "details": {
        "definition": "",
        "author": {
            "id": "x1gyl14",
            "title": "BuzzVid"
        }
    },
    "provider": "dailymotion"
}

{
    "id": "582603",
    "url": "http://tvcast.naver.com/v/582603",
    "name": "한국생활에 정 든 추사랑 “한국서 살고싶어”",
    "desc": "슈퍼맨이 돌아왔다 | 한국생활에 정 든 추사랑 “한국서 살고싶어”",
    "thumb_url": "https://phinf.pstatic.net/tvcast/20151025_190/AkWJa_1445766984283jVYYH_PNG/2Do9GAqaIuXP.png?type=f640",
    "duration": 113.39,
    "ctime": "2015-10-25T00:00:00+09:00",
    "ratings": {},
    "details": {
        "definition": "",
        "author": {
            "id": "wrappinguser16",
            "title": "슈퍼맨이 돌아왔다"
        },
        "naver": {
            "type": "rmc",
            "id": "9BC32CD10418DA3E3507824EBBE544930BA0",
            "key": "V12633341205ea37bf048329efcd1e2f1382a611bbd1d85bc56f8329efcd1e2f1382a"
        }
    },
    "provider": "navertvcast"
}

{
    "id": "2a39043b2108428a150fa27376adbea2",
    "url": "http://rutube.ru/video/2a39043b2108428a150fa27376adbea2/",
    "name": "- группа ' Моя Мишель' 13.02.2015",
    "desc": "https://vk.com/public53281593 #НовоеВидео: #",
    "thumb_url": "http://pic.rutube.ru/video/01/c4/01c4023404f364a32a015924154e23a3.jpg",
    "duration": 242,
    "ctime": "2015-02-14T05:33:33+09:00",
    "ratings": {},
    "details": {
        "definition": "",
        "author": {
            "id": 245325,
            "title": "музыка"
        },
        "embed": {
            "url": "http://rutube.ru/play/embed/7508261"
        }
    },
    "provider": "rutube"
}

{
    "id": "72583600",
    "url": "http://tvpot.daum.net/v/s6ad9xjxXVTXTazTzGTTaon",
    "name": "[Daum tv팟][17회 예고] &#39;길태미&#39; 박혁권, &#39;이방지&#39; 변요한과 최후의 대결? [육룡이 나르샤] 16회 20151124",
    "desc": "드라마 | 육룡이 나르샤 17회 \r\n본방송 | 11월 30일 월요일 밤 10시",
    "thumb_url": "http://i1.daumcdn.net/thumb/C480x270/?fname=http://i1.daumcdn.net/svc/image/U03/tvpot_thumb/s6ad9xjxXVTXTazTzGTTaon/thumb.png?t=1448411362833",
    "duration": 37,
    "ctime": "2015-11-24T23:54:43+09:00",
    "ratings": {},
    "details": {
        "definition": "",
        "author": {
            "id": "mRlSExWR4-Q0",
            "title": "SBS"
        },
        "embed": {
            "id": "s6ad9xjxXVTXTazTzGTTaon",
            "url": "http://videofarm.daum.net/controller/video/viewer/Video.html?vid=s6ad9xjxXVTXTazTzGTTaon&play_loc=undefined"
        }
    },
    "provider": "daumtvpot"
}
```


## Release History

See the [changelog](CHANGELOG.md)


## LICENSE

video-parser is licensed under the MIT license.
