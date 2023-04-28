const express = require("express");
const cors = require("cors");
const { MerkleTree } = require("merkletreejs");
const ethers = require("ethers");
const whitelist = require("./whitelist.json");

require("dotenv").config();


const PORT = process.env.PORT || 8081;
let whitelistTree = null;

const app = express();

const init = () => {
    const hashedAddresses = whitelist.map(addr => ethers.keccak256(addr));

    whitelistTree = new MerkleTree(hashedAddresses, ethers.keccak256, { sortPairs: true });
}

app.use(cors());

app.get("/whitelist/proof", (req, res) => {
    const address = req.query.address;

    if(!address) {
        res.status = 400;
        res.json({ error: "Got empty address" });
        return;
    }

    const leaf = ethers.keccak256(address);
    const proof = whitelistTree.getProof(leaf).map(proofObj => '0x' + proofObj.data.toString('hex'));

    res.json({ proof: proof });
});

app.get("/whitelist/check", (req, res) => {
    const address = req.query.address;

    if(!address) {
        res.status = 400;
        res.json({ error: "Got empty address" });
        return;
    }

    const leaf = ethers.keccak256(address);
    const proof = whitelistTree.getProof(leaf);
    const root = whitelistTree.getRoot();

    const isVerified = whitelistTree.verify(proof, leaf, root);

    res.json({ verified: isVerified });
});

app.listen(PORT, () => {
    init();
    console.log("Merkle tree initialized");

    console.log("App listening on port: ", PORT);
})