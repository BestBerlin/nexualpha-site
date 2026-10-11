"""Verify actual encoded reference streams and decode all frames locally."""
import json
import subprocess
import cv2
import numpy as np
from pathlib import Path
from PIL import Image
import engine

out=Path(__file__).parent/'samples/diagnostic'
manifest=json.loads((out/'render-manifest.json').read_text())
assert manifest['status']=='INCOMPLETE_SILENT_DIAGNOSTIC'
evidence={}
for label,size in [('master',(1920,1080)),('vertical',(1080,1920))]:
    for suffix in ('','-captions'):
        path=out/f'{label}-zh-Hans{suffix}.mp4'
        probe=json.loads(engine.run([engine.FFPROBE,'-v','error','-show_streams','-show_format','-of','json',path]))
        video=next(s for s in probe['streams'] if s['codec_type']=='video')
        audio=next(s for s in probe['streams'] if s['codec_type']=='audio')
        assert video['codec_name']=='h264' and video['pix_fmt']=='yuv420p'
        assert (video['width'],video['height'])==size and video['r_frame_rate']=='30/1'
        assert audio['codec_name']=='aac'
        assert abs(float(probe['format']['duration'])-manifest['duration'])<.05
        engine.run([engine.FFMPEG,'-v','error','-xerror','-i',path,'-f','null','-'])
        evidence[path.name]=probe
        print(f'{path.name}: H.264 {size[0]}x{size[1]} 30fps + AAC; duration {probe["format"]["duration"]}; full decode PASS')
assert Image.open(out/'poster.jpg').size==(1280,720)
raw=subprocess.run([engine.FFMPEG,'-v','error','-ss',str(manifest['duration']-3),'-i',str(out/'vertical-zh-Hans.mp4'),'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','pipe:1'],check=True,capture_output=True,env=engine.ENV).stdout
frame=np.frombuffer(raw,dtype=np.uint8).reshape((1920,1080,3))
decoded=cv2.QRCodeDetector().detectAndDecode(frame[950:1250,64:364])[0]
script=json.loads((Path(__file__).parent/'episodes/04-network-check.json').read_text())
expected=f'https://nexualpha.com/zh-hans/starter/{script["meta"]["slug"]}?src=academy-video'
assert decoded==expected, f'Encoded QR could not be decoded: {decoded}'
evidence['qr_decode']={'decoded':decoded,'expected':expected,'pass':True}
print('Portrait end-card QR: encoded-frame decode PASS')
(out/'ffprobe.json').write_text(json.dumps(evidence,indent=2)+'\n')
print('poster.jpg: 1280x720 PASS; ffprobe.json written')
