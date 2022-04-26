const http = require( 'http' ),
    fs   = require( 'fs' ),
    mime = require( 'mime' ),
    dir  = 'public/',
    openpgp = require('openpgp')
    port = 3001

let appdata = []

const server = http.createServer( function( request,response ) {
  if( request.method === 'GET' ) {
    handleGet( request, response )
  }else if( request.method === 'POST' ){
    handlePost( request, response )
  }
})

const handleGet = function( request, response ) {
  const filename = dir + request.url.slice( 1 )

  if( request.url === '/' ) {
    sendFile( response, 'public/index.html' )
  }else{
    sendFile( response, filename )
  }
}

const handlePost = function( request, response ) {
  let dataString = ''

  request.on( 'data', function( data ) {
    dataString += data
  })

  request.on('end',
      function () {
        switch (request.url) {
          case '/submit': {
            (async () => {
              const jsonset = JSON.parse(dataString)
              const {privateKey, publicKey} = await openpgp.generateKey({
                type: 'rsa', // Type of the key
                rsaBits: 4096, // RSA key size (defaults to 4096 bits)
                userIDs: [{name: jsonset.name, email: jsonset.email}], // you can pass multiple user IDs
                passphrase: jsonset.passphrase,// protects the private key
                format: "armored"
              }).then(function (value) {
                appdata.push(JSON.stringify({privateKey: value.privateKey, publickey: value.publicKey}))
                return false
              });
              const setup = appdata.pop()
              response.writeHead(200, "OK", {'Content-Type': 'text/plain'})
              response.end(setup)
            })();

          }
            break;
          case '/encrypt': {
            (async () => {
              let jsonset = JSON.parse(dataString)
              const {privateKey, publicKey} = await openpgp.generateKey({
                type: 'rsa', // Type of the key
                rsaBits: 4096, // RSA key size (defaults to 4096 bits)
                userIDs: [{name: jsonset.name, email: jsonset.email}], // you can pass multiple user IDs
                passphrase: jsonset.passphrase,// protects the private key
                format: "armored"
              }).then(function (value) {
                appdata.push(JSON.stringify({privateKey: value.privateKey, publicKey: value.publicKey}))
                return false
              })
              const processedJSON = JSON.parse(appdata.pop())
              const pubkey = await openpgp.readKey({armoredKey: processedJSON.publicKey}),
                  passphrase = jsonset.passphrase.valueOf();
              const privKey = await openpgp.decryptKey({
                privateKey: await openpgp.readPrivateKey({armoredKey: processedJSON.privateKey}),
                passphrase
              });

              const encrypted = await openpgp.encrypt({
                message: await openpgp.createMessage({text: jsonset.msg}), // input as Message object
                encryptionKeys: pubkey,
                signingKeys: privKey
              });
              console.log(encrypted); // '-----BEGIN PGP MESSAGE ... END PGP MESSAGE-----'
              response.writeHead(200, { 'Content-Type': 'application/json' });
              response.write(JSON.stringify(encrypted));
              response.end();
            })();

          }
          break;
          case '/decrypt': {
            (async () => {
              let jsonset = JSON.parse(dataString);
              const {privateKey, publicKey} = await openpgp.generateKey({
                type: 'rsa', // Type of the key
                rsaBits: 4096, // RSA key size (defaults to 4096 bits)
                userIDs: [{name: jsonset.name, email: jsonset.email}], // you can pass multiple user IDs
                passphrase: jsonset.passphrase,// protects the private key
                format: "armored"
              }).then(function (value) {
                appdata.push(JSON.stringify({privateKey: value.privateKey, publicKey: value.publicKey}))
                return false
              })
              const processedJSON = JSON.parse(appdata[0])
              if (jsonset.encmsg === '``') {
                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end();
                return false
              }
              const message = await openpgp.readMessage({
                armoredMessage: jsonset.encmsg.toString() // parse armored message
              });
              const passphrase = jsonset.passphrase.valueOf();
              const privKey = await openpgp.decryptKey({
                privateKey: await openpgp.readPrivateKey({ armoredKey: processedJSON.privateKey }),
                passphrase
              });
              const {data: decrypted, signatures} = await openpgp.decrypt({
                message,
                decryptionKeys: privKey
              });
              response.writeHead(200, { 'Content-Type': 'application/json' });
              response.write(JSON.stringify(decrypted));
              response.write(JSON.stringify(signatures));
              response.end();
            })();
            break;
          }
          default:
            break;
        }
      })
}

const sendFile = function( response, filename ) {
  const type = mime.getType( filename )

  fs.readFile( filename, function( err, content ) {

    // if the error = null, then we've loaded the file successfully
    if( err === null ) {

      // status code: https://httpstatuses.com
      response.writeHeader( 200, { 'Content-Type': type })
      response.end( content )

    }else{

      // file not found, error code 404
      response.writeHeader( 404 )
      response.end( '404 Error: File Not Found' )

    }
  })
}

server.listen( process.env.PORT || port )