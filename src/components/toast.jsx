export default function Toast({ message }) {
    return (
        <div className="fixed top-4 right-4 bg-rose-600 text-white px-4 py-2 rounded shadow z-[200] animate-fade">
            {message}
        </div>
    );
}