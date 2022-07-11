const express = require('express');
const mercadopago = require('mercadopago');
//huj
var bodyParser = require('body-parser');
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
//app.use(bodyParser.json());


const port = process.env.PORT || 3000

 //teatando 
  mercadopago.configure({
  sandbox: false,
  access_token: "APP_USR-4017170961404208-062211-9e5c5a7aa6923eb3f8d773e18f31a219-273449421",
 
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
        quantity: 1,
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

//

app.post("/process_payment", (req, res) => {
  const requestBody = req.body;
  console.log(requestBody); 
  const data = {
    transaction_amount:Number(requestBody.transaction_amount),
    description: requestBody.description,
    payment_method_id: "pix",
   
    
    payer: {
      email: requestBody.payer.email,
      first_name: requestBody.payer.first_name,
      last_name:requestBody.payer.last_name,
      identification: {
        type:requestBody.payer.identification.type,
        number:requestBody.payer.number
      }
    }//
  };
  console.log(data);
  mercadopago.payment.create(data)
    .then(function (data) {
      const { response } = data;

      res.status(201).json({
        id: response.id,
        amount: response.transaction_amount,
        status: response.status,
        detail: response.status_detail,
        qrCode: response.point_of_interaction.transaction_data.qr_code,
        qrCodeBase64: response.point_of_interaction.transaction_data.qr_code_base64,
      });
    }).catch(function (error) {
      console.log(error);
      const { errorMessage, errorStatus } = validateError(error);
      res.status(errorStatus).json({ error_message: errorMessage });
    });
});

function validateError(error) {
  let errorMessage = 'Unknown error cause';
  let errorStatus = 400;

  if (error.cause) {
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

module.exports = app;