const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const ipfsClient = require('ipfs-http-client');

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

// Connect to the IPFS API endpoint
const ipfs = ipfsClient.create({
    host: '127.0.0.1',
    port: '5001',
    protocol: 'http'
});

// Create Api Home
app.get('/', (req, res) => {
    res.render('home');
});


// Create Api Upload
app.post('/upload', async (req, res) => {
    const file = req.files.file;
    const fileName = req.body.fileName;
    const filePath = 'files/' + fileName;

    console.log('File Path:', filePath);

    // Download file into the server
    file.mv(filePath, async (err) => {
        if (err) {
            console.log('Error: failed to move file');
            return res.status(500).send(err);
        }

        try {
            // Get IPFS cid
            const fileHash = await addFile(fileName, filePath);
            fs.unlink(filePath, (err) => {
                if (err) console.log(err);
            });

            res.render('upload', { fileName, fileHash });
        } catch (error) {
            console.error('Error adding file to IPFS:', error);
            res.status(500).send('Error adding file to IPFS.');
        }
    });
});


const addFile = async (fileName, filePath) => {
    const file = fs.readFileSync(filePath);
    const fileAdded = await ipfs.add({ path: fileName, content: file });
    if (fileAdded) {
        const fileHash = fileAdded.cid;
        console.log('File added to IPFS with CID:', fileHash);
        return fileHash;
    } else {
        throw new Error('IPFS add operation failed.');
    }
};

app.listen(3000, () => {
    console.log('listening....');
});
