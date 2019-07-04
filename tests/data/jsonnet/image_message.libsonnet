local slack_events_api = import 'slack_events_api_base.libsonnet';

slack_events_api.template({
  "type": "app_mention",
  "text": "<@U0LAN0Z89> borrow",
  "files": [
     {
       "thumb_720": "https://selfpublishingadvice.org/wp-content/uploads/2017/07/sample-barcode.jpg",
       "thumb_720_w": 375,
       "thumb_720_h": 203,
     }
   ],
  "upload": true,
  "user": "UHHC97GG6",
  "display_as_bot": false,
  "ts": "1561776005.004000",
  "client_msg_id": "8ca92dce-1221-4a05-9902-a0a5fb6d6649",
  "channel": "C0LAN2Q65",
  "event_ts": "1561776005.004000"
})