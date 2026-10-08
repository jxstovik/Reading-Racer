"""Regenerate shipped offline narration using the eSpeak NG retrieval API.
Build-only system dependencies: libespeak-ng1, espeak-ng-data, libsndfile1.
The installed app needs none of these. Output is synthesized speech, not human recordings.
"""
import ctypes as c, hashlib, json, pathlib, array, math
root = pathlib.Path(__file__).resolve().parent.parent
spec = json.loads(pathlib.Path('/tmp/reading-racer-narration.json').read_text())
lib = c.CDLL('libespeak-ng.so.1')
lib.espeak_Initialize.argtypes = [c.c_int,c.c_int,c.c_char_p,c.c_int]
sample_rate = lib.espeak_Initialize(2,0,None,0)
if sample_rate <= 0: raise RuntimeError('eSpeak NG data missing')
lib.espeak_SetVoiceByName(b'en-us')
lib.espeak_SetParameter(1,145,0)
chunks=[]
@c.CFUNCTYPE(c.c_int,c.POINTER(c.c_short),c.c_int,c.c_void_p)
def receive(samples, length, events):
    if length: chunks.append(c.string_at(samples,length*2))
    return 0
lib.espeak_SetSynthCallback(receive)
lib.espeak_Synth.argtypes=[c.c_void_p,c.c_size_t,c.c_uint,c.c_int,c.c_uint,c.c_uint,c.c_void_p,c.c_void_p]
class SoundInfo(c.Structure):
    _fields_=[('frames',c.c_longlong),('samplerate',c.c_int),('channels',c.c_int),('format',c.c_int),('sections',c.c_int),('seekable',c.c_int)]
snd=c.CDLL('libsndfile.so.1')
snd.sf_open.argtypes=[c.c_char_p,c.c_int,c.POINTER(SoundInfo)];snd.sf_open.restype=c.c_void_p
snd.sf_write_short.argtypes=[c.c_void_p,c.POINTER(c.c_short),c.c_longlong];snd.sf_write_short.restype=c.c_longlong
snd.sf_close.argtypes=[c.c_void_p]
folder=root/'public/audio';folder.mkdir(exist_ok=True)
manifest={}
entries=[(t,t,1) for t in spec['texts']]+[(f'phoneme:{name}',f'[[{phone}]]',0x101) for name,phone in spec['phonemes'].items()]
for key,text,flags in entries:
    chunks.clear();data=text.encode()+b'\0';buf=c.create_string_buffer(data)
    result=lib.espeak_Synth(buf,len(data),0,1,0,flags,None,None);lib.espeak_Synchronize()
    if result: raise RuntimeError(f'Synthesis failed: {key}')
    pcm=b''.join(chunks)
    if key.startswith('phoneme:'):
        samples=array.array('h');samples.frombytes(pcm)
        # Sustain continuous consonants so a child can hear them. Keep stop sounds short,
        # and never append a spoken vowel. A silence gives space between blend counters.
        if key.split(':')[1] in ['m','n','s','f'] and samples:
            desired=int(sample_rate*.35);samples=(samples*math.ceil(desired/len(samples)))[:desired]
            fade=int(sample_rate*.01)
            for i in range(fade): samples[i]=int(samples[i]*i/fade);samples[-i-1]=int(samples[-i-1]*i/fade)
        samples.extend([0]*int(sample_rate*.18));pcm=samples.tobytes()
    name=hashlib.sha256(key.encode()).hexdigest()[:16]+'.ogg'
    info=SoundInfo(0,sample_rate,1,0x200000|0x0060,0,0)
    handle=snd.sf_open(str(folder/name).encode(),0x20,c.byref(info))
    if not handle: raise RuntimeError('Vorbis encoder unavailable')
    values=(c.c_short*(len(pcm)//2)).from_buffer_copy(pcm)
    written=snd.sf_write_short(handle,values,len(values));snd.sf_close(handle)
    if written!=len(values): raise RuntimeError('Audio write incomplete')
    manifest[key]=f'/audio/{name}'
# Remove only obsolete generated assets from this managed folder.
keep={pathlib.Path(v).name for v in manifest.values()}
for old in [*folder.glob('*.wav'),*folder.glob('*.ogg')]:
    if old.name not in keep: old.unlink()
(root/'src/data/narration.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(folder/'README.txt').write_text('Offline narration synthesized with eSpeak NG, American English. Phoneme clips use phonetic input, not letter-name TTS. Continuous consonants are sustained, stop consonants are short, and no trailing spoken vowel is added. Generated speech is application content; no eSpeak runtime is distributed. Regenerate with scripts/audio-texts.mjs then scripts/generate-audio.py (eSpeak NG and libsndfile build tools). These are synthetic voices. Try phonics sounds together with an adult before independent practice.\n')
print(f'Generated {len(entries)} compressed offline narration and phoneme clips.')
