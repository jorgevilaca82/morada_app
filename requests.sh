curl --request POST \
  --url http://localhost:3000/orders \
  --header 'X-Idempotency-Key: d41d8cd98f00b204e9800998ecf8427e' \
  --header 'content-type: application/json' \
  --data '{"orderNumber":"99000","customerName":"Jorge","totalAmount":80,"userId":1}'


curl --request GET \
  --url http://localhost:3000/orders \
  --header 'X-Idempotency-Key: d41d8cd98f00b204e9800998ecf8427e' \
  --header 'content-type: application/json' \
  --data '{"orderNumber":"99000","customerName":"Jorge","totalAmount":80,"userId":1}'


curl --request GET \
  --url http://localhost:3000/orders/3/status \
  --header 'X-Idempotency-Key: d41d8cd98f00b204e9800998ecf8427e' \
  --header 'content-type: application/json' \
  --data '{"orderNumber":"99000","customerName":"Jorge","totalAmount":80,"userId":1}'