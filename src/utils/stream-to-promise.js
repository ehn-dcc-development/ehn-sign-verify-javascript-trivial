module.exports = function streamToPromise(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    const onData = (chunk) => chunks.push(chunk);
    const onEnd = () => {
      unbind();
      resolve(Buffer.concat(chunks));
    };
    const onError = (error) => {
      unbind();
      reject(error);
    };
    const unbind = () => {
      stream.removeListener("data", onData);
      stream.removeListener("end", onEnd);
      stream.removeListener("data", onError);
    };

    stream.on("data", onData);
    stream.on("end", onEnd);
    stream.on("error", onError);
  });
};
