const express = require('express');
const mercadopago = require('mercadopago');
const mysql = require('./mysql').pool
const app = express();
const cors = require('cors');
app.use(cors());

app.use(express.urlencoded({ extended: false }));
app.use(express.json());


const port = process.env.PORT || 3000

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Header',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).send({});
  }
  next();
});

mercadopago.configure({
  sandbox: false,
  access_token: "APP_USR-4017170961404208-062211-9e5c5a7aa6923eb3f8d773e18f31a219-273449421",

})

//lista por um id especifico 
app.get("/pagamentos/:id_pagamento", (req, res, next) => {
  mysql.getConnection((error, conn) => {
    if (error) { return res.status(500).send({ error: error }) }
    conn.query(
      "SELECT * FROM pagamentos WHERE id_pagamento = ?;",
      [req.params.id_pagamento],
      (error, result, fields) => {
        if (error) { return res.status(500).send({ error: error }) }
        // formando um objeto mais detalhado

        if (result.length == 0) {
          return res.status(404).send({
            message: 'Não foi encontrado pagamento para este ID'
          })
        }

        const response = {

          pagamentos: {

            id_pagamento: result[0].id_pagamento,
            transaction_amount: result[0].transaction_amount,
            status: result[0].status_pagemento,
            description: result[0].description_pagamento,
            date_created: result[0].date_created,
            date_approved: result[0].date_approved,
            request: {
              tipo: 'GET',
              descricao: 'Retorna um pagamento específico '
              //url: process.env + 'valores'
            }
          }

        }
        return res.status(200).send(response)
      }
    )
  })
})


// lista todos os pagamentos 
app.get("/pagamentos", (req, res) => {
  mysql.getConnection((error, conn) => {
    if (error) { return res.status(500).send({ error: error }) }
    conn.query(
      "SELECT * FROM pagamentos",
      (error, result, fields) => {
        if (error) { return res.status(500).send({ error: error }) }
        // formando um objeto mais detalhado
        const response = {
          quantidade: result.length,
          pagamentos: result.map(pag => {
            return {
              id_pagamento: pag.id_pagamento,
              transaction_amount: pag.transaction_amount,
              status: pag.status_pagamento,
              description: pag.description_pagamento,
              date_created: pag.date_created,
              date_approved: pag.date_approved,


              request: {
                tipo: 'GET',
                descricao: 'gorjeta para ' + pag.description_pagamento,
                url: 'http://localhost:3000/pagamentos/' + pag.id_pagamento
              }
            }
          })
        }
        return res.status(200).send(response)
      }
    )
  })
})

// pagamento cartão mercado pago
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
  var id = req.query.id;

  const controladorTempo = setTimeout(() => {

    mercadopago.payment.findById(id).then(data => {
      var id_pagamento = data.response.external_reference
      var pagamento = data.response.status
      var transaction_amount = data.response.transaction_amount
      var description_pagamento = data.response.description
      var date_created = data.response.date_created
      var date_approved = data.response.date_approved


      console.log(id_pagamento)

      console.log(transaction_amount)
      console.log(description_pagamento)
      console.log(date_created)
      console.log(date_approved)

      if (date_approved == null) {
        console.log('ainda não pagou');

      } else {

        console.log('Pagou')

        mysql.getConnection((error, conn) => {
          conn.query(
            "SELECT * FROM pagamentos WHERE id_pagamento = ?;",
            (id_pagamento),
            (error, result, fields) => {

              if (result.length > 0) {
                res.status(409).send(
                  { mensagem: 'já está salvo' }
                )

              } else {

                console.log('preparando para salvar')
                var sql = conn.query('INSERT INTO pagamentos(id_pagamento, transaction_amount, status_pagamento, description_pagamento, date_created, date_approved)VALUES(?,?,?,?,?,?)',
                  [id_pagamento, transaction_amount, pagamento, description_pagamento, date_created, date_approved],
                  (sql, function (err, result) {
                    console.log(result)
                    conn.release();
                    console.log('passou do release :)')
                    if (err) throw err;
                    console.log("Salvou no banco !!!");
                  })
                )

              }
            }
          )
        })
      }
    }).catch(err => {
      console.log(err)
    });
  }, 20000)
  res.send('ok');
})


app.post("/process_payment", (req, res) => {
  const requestBody = req.body;

  var id = "" + Date.now();

  const data = {


    transaction_amount: Number(requestBody.transaction_amount),
    description: requestBody.description,
    payment_method_id: "pix",
    // exeternal_reference: id,

    payer: {
      email: requestBody.payer.email,
      first_name: requestBody.payer.first_name,
      last_name: requestBody.payer.last_name,
      identification: {
        type: String(requestBody.payer.identification.type),
        number: String(requestBody.payer.number)
      }
    },
    external_reference: id
  };


  mercadopago.payment.save(data)
    .then(function (data) {
      const { response } = data;
      console.log(response);
      res.status(201).json({
        id: response.id,
        external_reference: response.external_reference,
        description: response.description,
        name: response.first_name,
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

module.exports = app