import {initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,signOut} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
const app=initializeApp({apiKey:"AIzaSyDh_C_04Im_WVTHzkacmkmWrC1_IErSznU",authDomain:"tiverton-town-project-centre.firebaseapp.com",projectId:"tiverton-town-project-centre",storageBucket:"tiverton-town-project-centre.firebasestorage.app",messagingSenderId:"842162749288",appId:"1:842162749288:web:d6d9334f63afa4be4960dd"});
const auth=getAuth(app);
const allowedUid="Zd5BIrcwXhdpYHWCck0MmOEL9Ws2";
const gate=document.getElementById("auth-gate"),page=document.getElementById("private-app"),error=document.getElementById("auth-error");
onAuthStateChanged(auth,async user=>{if(user&&user.uid!==allowedUid){await signOut(auth);error.textContent="Account not authorised.";return;}gate.style.display=user?"none":"grid";page.style.display=user?"block":"none";});
document.getElementById("login-form").addEventListener("submit",async e=>{e.preventDefault();error.textContent="";try{await signInWithEmailAndPassword(auth,document.getElementById("login-email").value,document.getElementById("login-password").value);}catch(e){error.textContent="Unable to sign in. Check your details."; }});
document.getElementById("sign-out").addEventListener("click",()=>signOut(auth));
