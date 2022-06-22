const express = require('express');
const mercadopago = require('mercadopago');
const app = express();


mercadopago.configure({
    sandbox: true,
    access_token: "TEST-4017170961404208-062211-64e4dc637e50f3e02766bc5104e26d2d-273449421"
})

app.get("/", (req, res) => {
    res.send("olá mundo " + Date.now());
})

app.get("/pagar", async (req, res) => {

    var id = "" + Date.now();

    var dados = {
        items: [
            item = {
                id: id,
                description: "testes para digital ocean api pix :)",
                quantity:1,
                currency_id: 'BRL',
                unit_price: parseFloat(20)
            }

        ],
        payer: {
            email: "hemp2006@hotmail.com"
        },
        exeternal_reference: id
    }


    try {
        var pagamentos = await mercadopago.preferences.create(dados);
        console.log(pagamentos);
        return res.redirect(pagamentos.body.init_point);
    } catch (err) {
       return res.send(err.message)
    }

})

app.post('/not', (req, res) => {
    console.log(req.query);
    res.send('ok');
})

app.listen(80, (req, res) => {
    console.log('servidor rodando');
})