export const formatPath = (
    path: string,
    prefix: 'coins' | 'uploads' = 'uploads'
) => {
    // TODO: move host name into env variable
    return `http://localhost:3000/api/v1/static/${prefix}/${path}`
}
