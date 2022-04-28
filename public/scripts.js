// Add some Javascript code here, to run on the front end.

console.log("Welcome to assignment 2!")

function download(filename, text) {
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}


const submit = function(e) {
    e.preventDefault();

    document.getElementById('keysConf').innerHTML = '';

    const name = document.querySelector('#name'),
        email = document.querySelector('#email'),
        passphrase = document.querySelector('#passphrase')


        let json = {
            name: name.value,
            email: email.value,
            passphrase: passphrase.value
        };
        let body = JSON.stringify(json);

        fetch("/submit", {
            method: "POST",
            body
        }).then(function (response) {
            return response.json();
        })
            .then(function (keys) {
                download("private.txt", keys.privateKey.toString())
                download("public.txt", keys.publickey.toString())
                document.getElementById('keysConf').innerHTML = 'Keys have been generated and downloaded'
                return false
            });

    return false;
};

const encryptMessage = function(){

    const name = document.querySelector('#name'),
        email = document.querySelector('#email'),
        passphrase = document.querySelector('#passphrase'),
        message = document.querySelector('#messagenc');

    const json = {
        name: name.value,
        email: email.value,
        passphrase: passphrase.value,
        msg: message.value
    }
    let body = JSON.stringify(json);

    fetch("/encrypt", {
        method: "POST",
        body
    }).then(function(response) {
        return response.json();
    })
        .then(function (val){
            download('message.txt', val)
        })

    return false;
}

const decryptMessage = function(){

    const name = document.querySelector('#name'),
        email = document.querySelector('#email'),
        passphrase = document.querySelector('#passphrase'),
        message = document.querySelector('#decryption');

        let editing = message.textContent
        for (let i = 0; i < 2; i++) {
            editing.slice(0,-1);
        }
        editing.concat('`')
    const json = {
        name: name.value,
        email: email.value,
        passphrase: passphrase.value,
        encmsg: editing.toString()
    }
    let body = JSON.stringify(json);

    fetch("/decrypt", {
        method: "POST",
        body
    }).then(function(response) {
        return response.json();
    })
        .then(function (val){
            download('decodedmessage.txt', val)
        })

    return false;
}

window.onload = function () {
    const submitbutton = document.getElementById('submit');
    const encryptbutton = document.getElementById('encrypt');
    const decryptbutton = document.getElementById('decrypt');
    submitbutton.onclick = submit;
    encryptbutton.onclick = encryptMessage;
    decryptbutton.onclick = decryptMessage;
    document.getElementById('messagedc')
        .addEventListener('change', function() {

            let fr = new FileReader();
            fr.onload=function(){
                document.getElementById('decryption')
                    .textContent=fr.result;
            }

            fr.readAsText(this.files[0]);
        })
}