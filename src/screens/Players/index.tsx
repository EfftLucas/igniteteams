import { Header } from "@components/Header";
import { useEffect, useRef, useState } from "react";
import { Container, Form, HeaderList, NumbersOfPlayers } from "./styles";
import { Highlight } from "@components/Highlight";
import { ButtonIcon } from "@components/ButtonIcon";
import { Input } from "@components/Input";
import { Filter } from "@components/Filter";
import { Alert, FlatList, TextInput } from "react-native";
import { PlayerCard } from "@components/PlayerCard";
import { ListEmpty } from "@components/ListEmpty";
import { Button } from "@components/Button";
import { useNavigation, useRoute } from "@react-navigation/native";
import { AppError } from "@utils/AppError";
import { playerAddByGroup } from "@storage/player/playerAddByGroup";
import { playerGetByGroupAndTeam } from "@storage/player/playerGetByGroupAndTeam";
import { PlayerStorageDTO } from "@storage/player/PlayerStorageDTO";
import { playerRemoveByGroup } from "@storage/player/playerRemoveByGroup";
import { groupRemoveByName } from "@storage/group/groupRemoveByName";
import { Loading } from "@components/Loading";

type RouteParams =  {
  group: string;
}


export function Players() {
  const [isLoading, setIsLoading] = useState(true);
  const [newPlayerName, setNewPlayerName] = useState('');

  const [team, setTeam] = useState('Time A');
  const [players, setPlayers] = useState<PlayerStorageDTO[]>([]);

  const route = useRoute();

  const navigation = useNavigation();

  const { group } = route.params as RouteParams;

  const newPlayerNameInputRef = useRef<TextInput>(null);

  async function handleAddPlayer() {
    if(newPlayerName.trim().length === 0) {
      return Alert.alert('Nova Pessoa', 'Informe o nome da pessoa para adicionar');
    }
    const newPlayer = {
      name: newPlayerName,
      team,
    }
    try {
      await playerAddByGroup(newPlayer, group);
      newPlayerNameInputRef.current?.blur();
      setNewPlayerName('');
      fetchPlayersByTeam();

    } catch(error) {
      if(error instanceof AppError) {
        Alert.alert('Nova Pessoa', error.message);
      } else {
        console.log(error);
        Alert.alert('Nova Pessoa', 'Ocorreu um erro inesperado, tente novamente mais tarde');
      }
    }
  }

  async function fetchPlayersByTeam() {
    try {
      setIsLoading(true);
      const playersByTeam = await playerGetByGroupAndTeam(group, team);
      setPlayers(playersByTeam)

    } catch(error) {
      console.log(error);
      Alert.alert('Nova Pessoa', 'Nao foi possivel carregar as pessoas do time selecionado')
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePlayerRemove(playerName: string) {
    try {
      await playerRemoveByGroup(playerName, group);
      fetchPlayersByTeam();
    } catch (error) {
      console.log(error)
      Alert.alert('Remover Pessoa', 'Nao foi possivel remover a pessoa selecionada'); 
    }
  }
  async function groupRemove() {
    try {
      await groupRemoveByName(group);
      navigation.navigate('groups')
      
    } catch (error) {
      console.log(error)
      Alert.alert('Remover Grupo', 'Nao foi possivel remover a grupo selecionada'); 
    }
  }

  async function handleGroupRemove() {
    Alert.alert('Remover', 'Deseja remover a turma selecionada?',
      [
        {
          text: 'Cancelar', style: 'cancel',
        },
        {
          text: 'Remover', onPress: groupRemove
        }
      ]
    )
  }

  useEffect(() => {
    fetchPlayersByTeam();
  }, [team])
  
  return (
    <Container>
      <Header showBackButton />

      <Highlight
        title={group}
        subtitle="adicione a galera e separe os times"
      />

      <Form>
        <Input
          inputRef={newPlayerNameInputRef}
          placeholder="Nome do jogador"
          autoCorrect={false}
          onChangeText={setNewPlayerName}
          value={newPlayerName}
          onSubmitEditing={handleAddPlayer}
          returnKeyType="done"
        />
        <ButtonIcon icon="add" onPress={handleAddPlayer} />
      </Form>


      <HeaderList> 
        <FlatList
          data={['Time A', 'Time B']}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <Filter
              title={item}
              isActive={item === team}
              onPress={() => setTeam(item)}
            />
          )}
          horizontal
        />
        <NumbersOfPlayers>
          {players.length}
        </NumbersOfPlayers>
      </HeaderList>

      { isLoading 
      ? 
      <Loading /> 
      : 
      <FlatList
        data={players}
        keyExtractor={item => item.name}
        renderItem={({ item }) => (
          <PlayerCard
            name={item.name}
            onRemove={() => handlePlayerRemove(item.name)}
          />
        )}
        ListEmptyComponent={() => (
          <ListEmpty message="Nao ha pessoas nesse time" />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          { paddingBottom: 100 },
          players.length === 0 && { flex: 1 }
        ]}
      />
      
      }

      

      <Button
        title="Remover Turma"
        onPress={handleGroupRemove}
        type="SECONDARY"
      />
      
    </Container>
  )
}