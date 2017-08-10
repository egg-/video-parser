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
* [naver tv](http://tv.naver.com) - It can be stopped unexpectedly due to parse the data from the site.
* [rutube](http://rutube.ru/)
* [daum tvpot](http://tvpot.daum.net) - It can be stopped unexpectedly due to parse the data from the site.
* [tudou](http://www.tudou.com/)
* [gomtv](http://www.gomtv.com/) - by [@ignocide](https://github.com/ignocide)
* html5 - by [@revolunet](https://github.com/revolunet)

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
    // Save as in memory if redis is not specified
    redis: {
        host: '127.0.0.1',
        port: 6379,
        auth_pass: 'passwd' // (optional)
    },
    youtube: {
        key: ''
    },
    vimeo: {
        access_token: ''
    },
    youku: {
        key: ''
    },
    tudou: {
        key: ''
    },
    facebook: {
      appId: '',
      appSecret: '',
      access_token: ''
    },
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
    'http://tvcast.naver.com/v/1205110',
    'http://tv.naver.com/v/1341505',
    'http://rutube.ru/video/2a39043b2108428a150fa27376adbea2/',
    'http://tvpot.daum.net/mypot/View.do?clipid=72583600&ownerid=mRlSExWR4-Q0',
    'http://www.tudou.com/programs/view/uKg4c5O0YyQ/',
    'http://www.gomtv.com/14692214',
    'http://www.sample-videos.com/video/mp4/720/big_buck_bunny_720p_5mb.mp4'
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
   "id":"1205110",
   "url":"http://tvcast.naver.com/v/1205110",
   "name":"[긍정이 체질] 2화",
   "desc":"웹드라마 긍정이 체질 | 섭외 문제로 혜정(채서진)에게 오랜만에 \r\n연락하게 된 환동(도경수)은 과거를 회상한다.\r\n\r\n과거 선후배에서 연인으로 발전했다가\r\n이제는 남남이 된 환동과 혜정\r\n\r\n환동의 첫 영화 제작을 핑계로 둘은 3년만에 재회하지만\r\n자존심 싸움으로 상황은 힘들어 지기만 하는데...\r\n\r\n어려운 현실 속에서도 자신의 꿈에 도전하는\r\n이 시대 청춘들의 이야기를 유쾌하게 그려낸\r\n삼성 웹드라마＜긍정이 체질＞\r\n많은 시청 부탁드립니다~\r\n \r\n긍정이 체질 본편 모두 보기 ☞ http://blog.samsung.co.kr/bepositive",
   "thumb_url":"https://phinf.pstatic.net/tvcast/20161031_226/hSxsZ_14778885683893Df1N_JPEG/1477888568351.jpg?type=f640",
   "duration":694,
   "ctime":"2016-11-01T00:00:00+09:00",
   "ratings":{  

   },
   "tags":[  
      "채서진",
      "남기애",
      "김의성",
      "김종수",
      "이다윗",
      "디오",
      "웹드라마",
      "DO",
      "모",
      "부",
      "도경수",
      "황인국",
      "김환동",
      "방혜정",
      "마교수",
      "환동",
      "환동부",
      "환동모",
      "D.O."
   ],
   "details":{  
      "definition":"",
      "author":{  
         "id":"bepositive",
         "url":"bepositive",
         "title":"웹드라마 긍정이 체질"
      },
      "naver":{  
         "type":"rmc",
         "id":"8D5A6AABD32834944CAC6E3863F4F7171F37",
         "key":"V123c626743473d2bb53f4f3d181e67d1bf1e15438228ef78ab3a4f3d181e67d1bf1e"
      }
   },
   "provider":"navertvcast"
}

{
	"id": "1341505",
	"url": "http://tv.naver.com/v/1341505",
	"name": "[메이킹] 공동재, 김고은 본심 들통난 역사의 현장에서 '뽱' 터짐",
	"desc": "tvN 10주년 특별기획 ＜도깨비＞ | [메이킹] 깨비 집 식구들의 잔망美 대폭발! 깨비뉴이어~♡\r\n------------------\r\n------------------\r\ntvN 10주년 특별기획  ＜도깨비＞\r\n매주 금토 저녁 8시\r\n------------------\r\n------------------\r\n출연: 공유, 이동욱, 김고은, 유인나, 육성재 등 \r\n제작진: 극본 김은숙 작가/연출 이응복 감독\r\n줄거리: 불멸의 삶을 끝내기 위해 인간 신부가 필요한 도깨비, 그와 기묘한 동거를 시작한 기억상실증 저승사자. 그런 그들 앞에 '도깨비 신부'라 주장하는 '죽었어야 할 운명'의 소녀가 나타나며 벌어지는 신비로운 낭만 설화\r\n\r\n공식 홈페이지: www.chtvn.com/dokebi\r\n공식 페이스북: www.facebook.com/tvNdokebi",
	"thumb_url": "http://tvcast2.phinf.naver.net/20161230_9/fVsAB_14830605352061sDe3_JPEG/B120161931_EPI0009_05_B.jpg?type=f640",
	"duration": 146,
	"ctime": "2016-12-30T00:00:00+09:00",
	"ratings": {},
	"tags": [
		"김신",
		"저승사자",
		"유덕화",
		"지은탁",
		"메이킹",
		"공유",
		"이동욱",
		"육성재",
		"김고은"
	],
	"details": {
		"definition": "",
		"author": {
			"id": "wrappinguser23",
			"url": "cjenm.tvndokebi",
			"title": "tvN 10주년 특별기획 ＜도깨비＞"
		},
		"naver": {
			"type": "rmc",
			"id": "C6989E0E8014F615AD4E0A6DD4AD13278429",
			"key": "V1245a32a721e8557bd90f85f5da177373136be34e0fdd065be49f85f5da177373136"
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

{
    "id": "uKg4c5O0YyQ",
    "url": "http://www.tudou.com/programs/view/uKg4c5O0YyQ/",
    "name": "CHARIS首尔美妆之旅（9.21-25）预告片",
    "desc": "韩国潮流美妆平台CHARIS首尔美妆之旅（9.21-25）预告片",
    "thumb_url": "http://g4.tdimg.com/260146303/diy_w_1.jpg",
    "duration": 12000,
    "ctime": "2016-09-06T00:00:00+09:00",
    "ratings": {},
    "details": {
        "definition": "",
        "author": {
            "id": 993028656,
            "title": "CHARIS官方"
        }
    },
    "provider": "tudou"
}

{
	"id": "14692214",
	"url": "http://www.gomtv.com/14692214",
	"name": "담장 넘어간 타구를 잡아 낸 아담 존스의 완벽한 슈퍼 캐치 [미국 vs 도미니카]",
	"desc": "2017 월드베이스볼 클래식\r\n미국 vs 도미니카 [WBC 2017]\r\n\t\t\t\t\t\t\t\r\n태그 : WBC, 월드 베이스볼 클래식",
	"thumb_url": "http://chi.gomtv.com/cgi-bin/imgview.cgi?nid=11433506&type=11",
	"duration": 0,
	"ctime": "2017-03-19T00:00:00+09:00",
	"ratings": {},
	"tags": [
		"WBC",
		"월드 베이스볼 클래식"
	],
	"details": {
		"definition": "",
		"author": {},
		"embed": {
			"id": "2542eec85811250e10097d289b9e3248275af384060d38475176045dffe2",
			"url": "https://cubec.gomtv.com/player/VideoStart_v2.swf?sharemode=true&disablePopup=true&autoplay=false&h=2542eec85811250e10097d289b9e3248275af384060d38475176045dffe2"
		}
	},
	"provider": "gomtv"
}

{
	"id": "http://www.sample-videos.com/video/mp4/720/big_buck_bunny_720p_5mb.mp4",
	"url": "http://www.sample-videos.com/video/mp4/720/big_buck_bunny_720p_5mb.mp4",
	"name": "big_buck_bunny_720p_5mb",
	"duration": 29.568,
	"ctime": "1970-01-01T09:00:00+09:00",
	"provider": "html5"
}
```


## Release History

See the [changelog](CHANGELOG.md)


## LICENSE

video-parser is licensed under the MIT license.
