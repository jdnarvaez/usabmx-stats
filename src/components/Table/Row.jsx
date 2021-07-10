const Row = ({name, numberOfWins, numberOfPodiums, numberOfMains, seasonsRaced }) => (
  <div className="row">
    <div>{name}</div>
    <div>{numberOfWins}</div>
    <div>{numberOfPodiums}</div>
    <div>{numberOfMains}</div>
    <div>{seasonsRaced}</div>
  </div>
);

export default Row;
