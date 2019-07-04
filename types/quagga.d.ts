// This is required because of https://github.com/serratus/quaggaJS/pull/132
// which is merged but not shipped.

declare module "quagga" {
    import Quagga from "quagga/type-definitions/quagga";
    export default Quagga;
}
