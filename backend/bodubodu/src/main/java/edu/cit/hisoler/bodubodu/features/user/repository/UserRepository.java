package edu.cit.hisoler.bodubodu.features.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import edu.cit.hisoler.bodubodu.features.user.entity.UserEntity;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByEmail(String email);
}