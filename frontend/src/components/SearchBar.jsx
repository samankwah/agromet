const SearchBar = ({ setSearchTerm }) => {
  return (
    <div className="w-full md:w-1/6 mb-6 pt-12">
      <input
        type="text"
        placeholder="Search products..."
        onChange={(e) => setSearchTerm(e.target.value)}
        className="p-2 w-full border border-gray-300 rounded-lg"
      />
    </div>
  );
};

export default SearchBar;
