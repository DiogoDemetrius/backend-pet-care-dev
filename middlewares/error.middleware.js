moduleexport = (err, req, res, next) => {
    console.error('Erro:', stack);

    const status = err.statusCode || 500;
    const message = err.message || "Erro interno no servidor";

    res.status(status).json({
        success:false,
        message,
    })
}