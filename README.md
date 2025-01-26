# Pau Abella's Teton Walkie Talkie Solution

I was out with a friend of mine and showed them the v2, but then realized communication wasn't working.  

Turns out, PeeJS can't connect peers outside the same network by default, it needs a TURN server to work.  
It makes sense, but I didn't think about it while developing, because I was in the same network.  

I added a free tier (5GB monthly) Metered TURN server to the PeerJS initialization to make it work.

Hope you like it!

V3 with TURN server deployed here:
[https://wtalkieteton-v3.netlify.app/](https://wtalkieteton-v3.netlify.app/)