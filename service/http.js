var axios = require('axios')

exports.get = function(url, obj) {
  return new Promise(function(resolve, reject) {
    axios
      .get(url, {
        params: obj
      })
      .then(function(resp) {
        // console.log('token', resp.data)
        resolve(resp.data)
      })
  })
}
