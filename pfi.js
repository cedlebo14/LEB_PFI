// pfi.js

const http = require('http');
const url = require('url');
const fs = require('fs');
const { usagersData } = require('./liste_usagers.js'); // Charger les données des utilisateurs depuis un fichier externe

const PORT = process.env.PORT || 8000;

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // Fonction pour servir les fichiers HTML statiques
    function serveStaticFile(fileName, contentType = 'text/html') {
        const filePath = `./pagesWeb/${fileName}`; // Chemin du fichier
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                console.error(`Error reading file: ${err}`);
                return respondWithError(res, 500, 'Erreur interne du serveur.');
            }
            // Remplacer les placeholders avec les informations de l'utilisateur
            if (req.user) {
                data = data.replace('_nom_nom', req.user.nom).replace('_login_login', req.user.login);
            }
            res.writeHead(200, {'Content-Type': contentType});
            res.write(data);
            res.end();
        });
    }

    // Servir la page login.html dès le lancement du serveur
    if (pathname === '/') {
        return serveStaticFile('login.html');
    }

    // Si l'utilisateur accède à la page de formulaire de connexion, renvoyer login.html
    if (pathname === '/login.html') {
        return serveStaticFile('login.html');
    }

    // Si l'utilisateur accède à la page de traitement des données du formulaire de connexion
    if (pathname === '/login_get.html' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString(); // Convertir le corps de la requête en chaîne de caractères
        });
        req.on('end', () => {
            const formData = new URLSearchParams(body);
            const username = formData.get('username');
            const password = formData.get('password');
            const user = usagersData.find(usr => usr.login === username && usr.pwd === password);
            if (user) {
                req.user = user;
                // Renvoyer la page correspondant au niveau d'accès de l'utilisateur
                switch (user.acces) {
                    case 'normal':
                        return serveStaticFile('pageUsager.html', user);
                    case 'admin':
                        return serveStaticFile('pageAdmin.html', user);
                    case 'restreint':
                        return serveStaticFile('pageRestreinte.html', user);
                }
            } else {
                return respondWithError(res, 401, 'Identifiant ou mot de passe invalide.');
            }
        });
    }
});

// Fonction pour répondre avec une erreur
function respondWithError(res, statusCode, message) {
    res.writeHead(statusCode, {'Content-Type': 'text/html'});
    res.write(`<h1>${message}</h1>`);
    res.end();
}

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});






