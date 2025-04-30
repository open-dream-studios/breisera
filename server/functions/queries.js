// export const safeQueryPromise = async (sql, params) => {
//   console.log(sql, params)
//   return new Promise((resolve) => {
//     db.query(sql, params, (err, data) => {
//       if (err) {
//         console.error("DB Query Error:", err);
//         console.log("ERROR")
//         reject(err);
//       }
//       console.log(data)
//       resolve(data);
//     });
//   });
// };