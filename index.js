const express = require('express');
const mercadopago = require('mercadopago');


const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

var bodyParser = require('body-parser'); 

const port = process.env.PORT || 3000

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

// notificação mercado pago
app.post('/not', (req, res) => {
    console.log(req.query);
    res.send('ok');
})



app.post("/pix", (req, res) => {
  const requestBody = req.body;

  const data = {
    payment_method_id: "pix",
    description: requestBody.description,
    transaction_amount: Number(requestBody.transactionAmount),
    payer: {
      email: requestBody.payer.email,
      first_name: requestBody.payer.firstName,
      last_name: requestBody.payer.lastName,
      identification: {
        type: requestBody.payer.identification.type,
        number: requestBody.payer.identification.number,
      }
    }
  };

    mercadopago.payment.create(data)
      .then(function(data) {
          const { response } = data;
  
          res.status(201).json({
            id: response.id,
            amount: response.transaction_amount,
            status: response.status,
            detail: response.status_detail,
            qrCode: response.point_of_interaction.transaction_data.qr_code,
            qrCodeBase64: response.point_of_interaction.transaction_data.qr_code_base64,
          });
      }).catch(function(error) {
        console.log(error);
        const { errorMessage, errorStatus }  = validateError(error);
        res.status(errorStatus).json({ error_message: errorMessage });
      });
  });
  
  function validateError(error) {
    let errorMessage = 'Unknown error cause';
    let errorStatus = 400;
  
    if(error.cause) {
      const sdkErrorMessage = error.cause[0].description;
      errorMessage = sdkErrorMessage || errorMessage;
  
      const sdkErrorStatus = error.status;
      errorStatus = sdkErrorStatus || errorStatus;
    }
  
    return { errorMessage, errorStatus };
  }
  
app.listen(port, (req, res) => {
    console.log('servidor rodando');
})