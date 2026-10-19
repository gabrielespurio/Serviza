import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Search, X, ChevronRight, ListFilter, ArrowLeft, Check, Sparkles, Briefcase } from './icons';
import { JOB_CATEGORIES, JobCategory } from '../data/jobCategories';
import { CategoryIcon } from './CategoryIcon';

export interface ProfessionSelection {
  profession: string;
  categoryId: string;
  categoryLabel: string;
}

interface ProfessionSelectorProps {
  selectedProfession?: string;
  selectedCategory?: string;
  onSelect: (selection: ProfessionSelection) => void;
  placeholder?: string;
}

// Flatten all professions once in memory for instant performance
interface FlatProfessionItem {
  profession: string;
  normalizedProfession: string;
  categoryId: string;
  categoryLabel: string;
  normalizedCategory: string;
  color: string;
  bgColor: string;
}

const ALL_PROFESSIONS: FlatProfessionItem[] = JOB_CATEGORIES.flatMap((cat) =>
  cat.professions.map((prof) => ({
    profession: prof,
    normalizedProfession: prof.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(),
    categoryId: cat.id,
    categoryLabel: cat.label,
    normalizedCategory: cat.label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(),
    color: cat.color,
    bgColor: cat.bgColor,
  }))
);

// Normalize helper for user input
const normalizeText = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function ProfessionSelector({
  selectedProfession,
  selectedCategory,
  onSelect,
  placeholder = 'Ex.: Garçom, Piscineiro, Eletricista...',
}: ProfessionSelectorProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [activeCategoryForBrowse, setActiveCategoryForBrowse] = useState<JobCategory | null>(null);
  const [userCategories, setUserCategories] = useState<string[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load user categories from local storage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const raw = await AsyncStorage.getItem('@ContrataAI:userData');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.categories && Array.isArray(parsed.categories)) {
            setUserCategories(parsed.categories);
          }
        }
      } catch (e) {
        console.log('Error loading user categories for suggestions', e);
      }
    };
    loadUserData();
  }, []);

  // Debounce search query (~300ms)
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) {
      setDebouncedQuery('');
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setIsSearching(false);
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  // Instant filtering based on debounced query
  const filteredProfessions = useMemo(() => {
    if (!debouncedQuery.trim()) {
      if (userCategories.length > 0) {
        // Find top 3 professions from each user favorite category
        const suggestions: FlatProfessionItem[] = [];
        userCategories.forEach(catId => {
          const profs = ALL_PROFESSIONS.filter(p => p.categoryId === catId).slice(0, 3);
          suggestions.push(...profs);
        });
        
        // If we still need more to fill the list, pad with generic suggestions
        if (suggestions.length < 8) {
          const others = ALL_PROFESSIONS.filter(p => !suggestions.includes(p)).slice(0, 8 - suggestions.length);
          suggestions.push(...others);
        }
        return suggestions;
      }
      
      // Global mix if no user categories (pick 1 popular from the first 8 distinct categories)
      const distinctCats = new Set<string>();
      const mix: FlatProfessionItem[] = [];
      for (const p of ALL_PROFESSIONS) {
        if (!distinctCats.has(p.categoryId)) {
          distinctCats.add(p.categoryId);
          mix.push(p);
        }
        if (mix.length === 8) break;
      }
      return mix;
    }
    const normalized = normalizeText(debouncedQuery.trim());
    return ALL_PROFESSIONS.filter(
      (item) =>
        item.normalizedProfession.includes(normalized) ||
        item.normalizedCategory.includes(normalized)
    );
  }, [debouncedQuery, userCategories]);

  const handleSelect = (item: { profession: string; categoryId: string; categoryLabel: string }) => {
    setQuery('');
    setDebouncedQuery('');
    onSelect(item);
    setShowCategoriesModal(false);
    setActiveCategoryForBrowse(null);
  };

  // If already selected and not actively searching/changing
  const isSelectedView = !!selectedProfession && !query;

  return (
    <View className="w-full">
      {/* Selected Card View */}
      {isSelectedView ? (
        <View className="bg-[#FFF4ED] border-2 border-[#F97316] rounded-3xl p-5 mb-4 flex-row items-center justify-between shadow-sm">
          <View className="flex-1 pr-4">
            <View className="flex-row items-center mb-1">
              <View className="bg-[#F97316] px-2.5 py-0.5 rounded-full mr-2">
                <Text className="text-white text-[10px] font-extrabold uppercase tracking-wider">
                  Selecionado
                </Text>
              </View>
              <Text className="text-[#64748B] text-xs font-semibold">
                Categoria: {selectedCategory || 'Geral'}
              </Text>
            </View>
            <Text className="text-[#1E293B] text-xl font-extrabold">{selectedProfession}</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setQuery(' ')} // triggers open search mode
            className="bg-white border border-[#F99D4C] px-4 py-2.5 rounded-xl shadow-sm"
          >
            <Text className="text-[#F97316] font-bold text-xs">Trocar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Prominent Search Bar (iFood/Uber style) */}
      <View className="mb-3">
        <Text className="text-[#1E293B] text-base font-bold mb-2">
          Qual profissional você procura?
        </Text>

        <View className="flex-row items-center bg-white border-2 border-slate-200 rounded-2xl px-4 py-3.5 shadow-sm focus:border-[#F97316]">
          <Search color="#F97316" size={22} className="mr-3" />
          <TextInput
            placeholder={placeholder}
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            className="flex-1 text-[#1E293B] text-base font-semibold p-0"
          />
          {query.trim().length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setDebouncedQuery(''); }} hitSlop={10}>
              <X color="#94A3B8" size={20} />
            </TouchableOpacity>
          )}
          {isSearching && <ActivityIndicator size="small" color="#F97316" style={{ marginLeft: 8 }} />}
        </View>
      </View>

      {/* Discreet button to browse all categories */}
      <View className="flex-row justify-between items-center mb-4 px-1">
        <Text className="text-xs text-[#64748B] font-medium">
          {query.trim() ? `Resultados para "${query.trim()}"` : 'Sugestões populares para contratação'}
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowCategoriesModal(true)}
          className="flex-row items-center py-1 px-2.5 rounded-lg bg-slate-100 border border-slate-200/80"
        >
          <ListFilter color="#475569" size={14} className="mr-1.5" />
          <Text className="text-[#475569] font-bold text-xs">Ver todas as categorias</Text>
        </TouchableOpacity>
      </View>

      {/* Search Results / Suggestions List */}
      <View className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        {filteredProfessions.length === 0 ? (
          <View className="p-8 items-center justify-center">
            <View className="w-12 h-12 rounded-full bg-slate-100 items-center justify-center mb-3">
              <Search color="#94A3B8" size={24} />
            </View>
            <Text className="text-[#1E293B] font-bold text-base mb-1 text-center">
              Profissão não encontrada
            </Text>
            <Text className="text-[#64748B] text-xs text-center leading-relaxed">
              Verifique a ortografia ou clique em "Ver todas as categorias" para navegar por toda a lista.
            </Text>
          </View>
        ) : (
          filteredProfessions.map((item, index) => {
            const isLast = index === filteredProfessions.length - 1;
            const isCurrentlySelected = selectedProfession === item.profession;

            return (
              <TouchableOpacity
                key={`${item.categoryId}-${item.profession}-${index}`}
                activeOpacity={0.7}
                onPress={() => handleSelect(item)}
                className={`flex-row items-center justify-between p-4 ${
                  !isLast ? 'border-b border-slate-100' : ''
                } ${isCurrentlySelected ? 'bg-[#FFF4ED]' : ''}`}
              >
                <View className="flex-row items-center flex-1 pr-3">
                  <View
                    className="w-10 h-10 rounded-xl items-center justify-center mr-3.5"
                    style={{ backgroundColor: item.bgColor }}
                  >
                    <CategoryIcon category={item.categoryId} profession={item.profession} color={item.color} size={18} />
                  </View>
                  <View className="flex-1">
                    <Text className={`text-[15px] font-extrabold ${isCurrentlySelected ? 'text-[#F97316]' : 'text-[#1E293B]'}`}>
                      {item.profession}
                    </Text>
                    <Text className="text-xs text-[#64748B] font-medium mt-0.5">
                      Categoria: {item.categoryLabel}
                    </Text>
                  </View>
                </View>

                {isCurrentlySelected ? (
                  <View className="w-7 h-7 rounded-full bg-[#F97316] items-center justify-center">
                    <Check color="#fff" size={14} strokeWidth={3} />
                  </View>
                ) : (
                  <ChevronRight color="#CBD5E1" size={18} />
                )}
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* ========== MODAL: BROWSE ALL CATEGORIES ========== */}
      <Modal
        visible={showCategoriesModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCategoriesModal(false);
          setActiveCategoryForBrowse(null);
        }}
      >
        <View className="flex-1 bg-[#FAFAFA] pt-4">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-6 pb-4 border-b border-slate-200 bg-white">
            {activeCategoryForBrowse ? (
              <TouchableOpacity
                onPress={() => setActiveCategoryForBrowse(null)}
                className="flex-row items-center py-1"
              >
                <ArrowLeft color="#64748B" size={20} />
                <Text className="text-[#64748B] font-bold text-sm ml-2">Voltar às categorias</Text>
              </TouchableOpacity>
            ) : (
              <View>
                <Text className="text-xl font-extrabold text-[#1E293B]">Todas as Categorias</Text>
                <Text className="text-xs text-[#64748B]">Selecione uma categoria para ver as profissões</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={() => {
                setShowCategoriesModal(false);
                setActiveCategoryForBrowse(null);
              }}
              className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
            >
              <X color="#64748B" size={18} />
            </TouchableOpacity>
          </View>

          {/* Modal Content */}
          <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {activeCategoryForBrowse ? (
              /* Professions of selected category */
              <View>
                <View className="bg-white rounded-3xl p-5 border border-slate-100 mb-4 flex-row items-center">
                  <View
                    className="w-14 h-14 rounded-2xl items-center justify-center mr-3.5"
                    style={{ backgroundColor: 'transparent' }}
                  >
                    <CategoryIcon category={activeCategoryForBrowse.id} color={activeCategoryForBrowse.color} size={28} />
                  </View>
                  <View>
                    <Text className="text-[#1E293B] text-lg font-extrabold">
                      {activeCategoryForBrowse.label}
                    </Text>
                    <Text className="text-xs text-[#64748B]">
                      {activeCategoryForBrowse.professions.length} profissões disponíveis
                    </Text>
                  </View>
                </View>

                <View className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                  {activeCategoryForBrowse.professions.map((prof, idx) => {
                    const isLast = idx === activeCategoryForBrowse.professions.length - 1;
                    const isSelected = selectedProfession === prof;

                    return (
                      <TouchableOpacity
                        key={prof}
                        activeOpacity={0.7}
                        onPress={() =>
                          handleSelect({
                            profession: prof,
                            categoryId: activeCategoryForBrowse.id,
                            categoryLabel: activeCategoryForBrowse.label,
                          })
                        }
                        className={`flex-row items-center justify-between p-4 ${
                          !isLast ? 'border-b border-slate-100' : ''
                        } ${isSelected ? 'bg-[#FFF4ED]' : ''}`}
                      >
                        <Text className={`text-[15px] font-bold ${isSelected ? 'text-[#F97316]' : 'text-[#1E293B]'}`}>
                          {prof}
                        </Text>
                        {isSelected ? (
                          <View className="w-6 h-6 rounded-full bg-[#F97316] items-center justify-center">
                            <Check color="#fff" size={12} strokeWidth={3} />
                          </View>
                        ) : (
                          <ChevronRight color="#CBD5E1" size={18} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : (
              /* Categories Grid / List */
              <View className="space-y-3 gap-3">
                {JOB_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    activeOpacity={0.7}
                    onPress={() => setActiveCategoryForBrowse(cat)}
                    className="bg-white rounded-2xl p-4 border border-slate-100 flex-row items-center justify-between shadow-sm"
                  >
                    <View className="flex-row items-center flex-1 pr-3">
                      <View
                        className="w-12 h-12 rounded-2xl items-center justify-center mr-3.5"
                        style={{ backgroundColor: 'transparent' }}
                      >
                        <CategoryIcon category={cat.id} color={cat.color} size={24} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-[16px] font-extrabold text-[#1E293B]">
                          {cat.label}
                        </Text>
                        <Text className="text-xs text-[#64748B] font-medium mt-0.5">
                          {cat.professions.slice(0, 3).join(', ')}...
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      <View className="bg-slate-100 px-2.5 py-1 rounded-full mr-2">
                        <Text className="text-[11px] font-bold text-[#475569]">
                          {cat.professions.length}
                        </Text>
                      </View>
                      <ChevronRight color="#CBD5E1" size={18} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
