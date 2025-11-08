// Fetcher function for SWR
const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default fetcher
